// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TreasureHunt
 * @notice A treasure hunt game where creators set up hunts with clues and rewards,
 *         and players solve clues sequentially to earn cUSD rewards.
 */
contract TreasureHunt is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // cUSD token address on Celo mainnet
    IERC20 public immutable cUSD;
    
    struct Clue {
        string clueText;
        bytes32 answerHash; // keccak256 hash of the answer
        uint256 reward; // Reward amount in cUSD (with 18 decimals)
        string location; // Optional location name
        bool exists;
    }
    
    struct Hunt {
        address creator;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 totalRewards; // Total rewards funded
        uint256 totalClaimed; // Total rewards claimed
        uint256 clueCount;
        bool published;
        bool exists;
    }
    
    struct PlayerProgress {
        uint256 currentClueIndex; // 0-indexed, next clue to solve
        uint256 totalEarned;
        bool hasStarted;
    }
    
    // Hunt ID => Hunt details
    mapping(uint256 => Hunt) public hunts;
    
    // Hunt ID => Clue Index => Clue details
    mapping(uint256 => mapping(uint256 => Clue)) public clues;
    
    // Hunt ID => Player Address => Progress
    mapping(uint256 => mapping(address => PlayerProgress)) public playerProgress;
    
    // Hunt ID => Player Address => Clue Index => Claimed
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public hasClaimed;
    
    // Track if address is a registered creator
    mapping(address => bool) public isCreator;
    
    // Track total hunts created
    uint256 public totalHunts;
    
    // Events
    event CreatorRegistered(address indexed creator);
    event HuntCreated(uint256 indexed huntId, address indexed creator, string title);
    event ClueAdded(uint256 indexed huntId, uint256 indexed clueIndex, string clueText, uint256 reward);
    event HuntFunded(uint256 indexed huntId, uint256 amount);
    event HuntPublished(uint256 indexed huntId);
    event AnswerSubmitted(uint256 indexed huntId, address indexed player, uint256 clueIndex, bool correct);
    event RewardClaimed(uint256 indexed huntId, address indexed player, uint256 clueIndex, uint256 amount);
    event HuntCompleted(uint256 indexed huntId, address indexed player, uint256 totalEarned);
    
    constructor(address _cUSD) {
        require(_cUSD != address(0), "Invalid cUSD address");
        cUSD = IERC20(_cUSD);
    }
    
    /**
     * @notice Register as a hunt creator (one-time)
     */
    function registerCreator() external {
        require(!isCreator[msg.sender], "Already registered");
        isCreator[msg.sender] = true;
        emit CreatorRegistered(msg.sender);
    }
    
    /**
     * @notice Create a new treasure hunt
     * @param _title Hunt title (max 100 chars)
     * @param _description Hunt description (max 500 chars)
     * @param _startTime Start time (0 for immediate)
     * @param _endTime End time (0 for indefinite)
     */
    function createHunt(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) external returns (uint256) {
        require(isCreator[msg.sender], "Not a registered creator");
        require(bytes(_title).length > 0 && bytes(_title).length <= 100, "Invalid title length");
        require(bytes(_description).length <= 500, "Description too long");
        
        uint256 huntId = totalHunts;
        totalHunts++;
        
        hunts[huntId] = Hunt({
            creator: msg.sender,
            title: _title,
            description: _description,
            startTime: _startTime == 0 ? block.timestamp : _startTime,
            endTime: _endTime,
            totalRewards: 0,
            totalClaimed: 0,
            clueCount: 0,
            published: false,
            exists: true
        });
        
        emit HuntCreated(huntId, msg.sender, _title);
        return huntId;
    }
    
    /**
     * @notice Add a clue to a hunt
     * @param _huntId The hunt ID
     * @param _clueText The clue text/hint
     * @param _answerHash The keccak256 hash of the answer (lowercase, no spaces)
     * @param _reward Reward amount in cUSD (with 18 decimals, min 0.01, max 10.00)
     * @param _location Optional location name
     */
    function addClue(
        uint256 _huntId,
        string memory _clueText,
        bytes32 _answerHash,
        uint256 _reward,
        string memory _location
    ) external {
        Hunt storage hunt = hunts[_huntId];
        require(hunt.exists, "Hunt does not exist");
        require(hunt.creator == msg.sender, "Not the creator");
        require(!hunt.published, "Hunt already published");
        require(hunt.clueCount < 20, "Max 20 clues per hunt");
        require(bytes(_clueText).length > 0 && bytes(_clueText).length <= 500, "Invalid clue text");
        require(_reward >= 0.01 ether && _reward <= 10 ether, "Reward out of range"); // 0.01 to 10 cUSD
        require(bytes(_location).length <= 100, "Location too long");
        
        uint256 clueIndex = hunt.clueCount;
        clues[_huntId][clueIndex] = Clue({
            clueText: _clueText,
            answerHash: _answerHash,
            reward: _reward,
            location: _location,
            exists: true
        });
        
        hunt.clueCount++;
        
        emit ClueAdded(_huntId, clueIndex, _clueText, _reward);
    }
    
    /**
     * @notice Fund a hunt with cUSD
     * @param _huntId The hunt ID
     * @param _amount Total amount to fund (must match sum of all clue rewards)
     */
    function fundHunt(uint256 _huntId, uint256 _amount) external nonReentrant {
        Hunt storage hunt = hunts[_huntId];
        require(hunt.exists, "Hunt does not exist");
        require(hunt.creator == msg.sender, "Not the creator");
        require(hunt.clueCount > 0, "No clues added");
        
        // Calculate total rewards needed
        uint256 totalNeeded = 0;
        for (uint256 i = 0; i < hunt.clueCount; i++) {
            totalNeeded += clues[_huntId][i].reward;
        }
        
        require(_amount >= totalNeeded - hunt.totalRewards, "Insufficient funding");
        
        // Transfer cUSD from creator to contract
        cUSD.safeTransferFrom(msg.sender, address(this), _amount);
        
        hunt.totalRewards += _amount;
        
        emit HuntFunded(_huntId, _amount);
    }
    
    /**
     * @notice Publish a hunt (make it playable)
     * @param _huntId The hunt ID
     */
    function publishHunt(uint256 _huntId) external {
        Hunt storage hunt = hunts[_huntId];
        require(hunt.exists, "Hunt does not exist");
        require(hunt.creator == msg.sender, "Not the creator");
        require(!hunt.published, "Already published");
        require(hunt.clueCount > 0, "No clues added");
        
        // Check if fully funded
        uint256 totalNeeded = 0;
        for (uint256 i = 0; i < hunt.clueCount; i++) {
            totalNeeded += clues[_huntId][i].reward;
        }
        require(hunt.totalRewards >= totalNeeded, "Hunt not fully funded");
        
        hunt.published = true;
        
        emit HuntPublished(_huntId);
    }
    
    /**
     * @notice Submit an answer for a clue
     * @param _huntId The hunt ID
     * @param _clueIndex The clue index (0-indexed)
     * @param _answerHash The keccak256 hash of the submitted answer
     */
    function submitAnswer(
        uint256 _huntId,
        uint256 _clueIndex,
        bytes32 _answerHash
    ) external nonReentrant {
        Hunt storage hunt = hunts[_huntId];
        require(hunt.exists, "Hunt does not exist");
        require(hunt.published, "Hunt not published");
        require(block.timestamp >= hunt.startTime, "Hunt not started");
        require(hunt.endTime == 0 || block.timestamp <= hunt.endTime, "Hunt ended");
        require(_clueIndex < hunt.clueCount, "Invalid clue index");
        
        Clue storage clue = clues[_huntId][_clueIndex];
        require(clue.exists, "Clue does not exist");
        
        PlayerProgress storage progress = playerProgress[_huntId][msg.sender];
        
        // Check if player has started (for first clue) or is on the correct clue
        if (!progress.hasStarted) {
            require(_clueIndex == 0, "Must start with first clue");
            progress.hasStarted = true;
            progress.currentClueIndex = 0;
        } else {
            require(_clueIndex == progress.currentClueIndex, "Must solve clues sequentially");
        }
        
        // Check if already claimed
        require(!hasClaimed[_huntId][msg.sender][_clueIndex], "Already claimed");
        
        // Verify answer
        bool isCorrect = _answerHash == clue.answerHash;
        
        emit AnswerSubmitted(_huntId, msg.sender, _clueIndex, isCorrect);
        
        if (isCorrect) {
            // Mark as claimed
            hasClaimed[_huntId][msg.sender][_clueIndex] = true;
            
            // Transfer reward
            cUSD.safeTransfer(msg.sender, clue.reward);
            
            // Update progress
            progress.currentClueIndex++;
            progress.totalEarned += clue.reward;
            hunt.totalClaimed += clue.reward;
            
            emit RewardClaimed(_huntId, msg.sender, _clueIndex, clue.reward);
            
            // Check if hunt is completed
            if (progress.currentClueIndex >= hunt.clueCount) {
                emit HuntCompleted(_huntId, msg.sender, progress.totalEarned);
            }
        }
    }
    
    /**
     * @notice Get player progress for a hunt
     * @param _huntId The hunt ID
     * @param _player The player address
     */
    function getPlayerProgress(uint256 _huntId, address _player)
        external
        view
        returns (PlayerProgress memory)
    {
        return playerProgress[_huntId][_player];
    }
    
    /**
     * @notice Get hunt details
     * @param _huntId The hunt ID
     */
    function getHunt(uint256 _huntId) external view returns (Hunt memory) {
        return hunts[_huntId];
    }
    
    /**
     * @notice Get clue details
     * @param _huntId The hunt ID
     * @param _clueIndex The clue index
     */
    function getClue(uint256 _huntId, uint256 _clueIndex)
        external
        view
        returns (Clue memory)
    {
        return clues[_huntId][_clueIndex];
    }
    
    /**
     * @notice Allow creator to refund unused funds (if hunt not published or ended)
     * @param _huntId The hunt ID
     */
    function refundHunt(uint256 _huntId) external nonReentrant {
        Hunt storage hunt = hunts[_huntId];
        require(hunt.exists, "Hunt does not exist");
        require(hunt.creator == msg.sender, "Not the creator");
        require(!hunt.published || (hunt.endTime > 0 && block.timestamp > hunt.endTime), "Cannot refund active hunt");
        
        uint256 refundAmount = hunt.totalRewards - hunt.totalClaimed;
        require(refundAmount > 0, "Nothing to refund");
        
        hunt.totalRewards = hunt.totalClaimed;
        cUSD.safeTransfer(msg.sender, refundAmount);
    }
}

