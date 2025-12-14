import { UserRejectedRequestError } from 'viem';

export type ParsedError = {
  message: string;
  isUserRejection: boolean;
};

/**
 * Parses transaction errors and returns user-friendly messages.
 * Handles UserRejectedRequestError specially by logging at info level.
 */
export function parseTransactionError(error: unknown): ParsedError {
  if (!error) {
    return { message: '', isUserRejection: false };
  }

  // Handle user rejection
  if (error instanceof UserRejectedRequestError) {
    console.info('Action not confirmed');
    return { message: 'Action not confirmed', isUserRejection: true };
  }

  // Check for user rejection patterns in error message/name
  const errorStr = String(error);
  const errorMessage = error instanceof Error ? error.message : errorStr;
  const errorName = error instanceof Error ? error.name : '';

  // Common user rejection patterns
  const userRejectionPatterns = [
    'user rejected',
    'user denied',
    'user cancelled',
    'user canceled',
    'rejected the request',
    'denied transaction',
    'transaction was rejected',
    'ACTION_REJECTED',
    'UserRejectedRequestError',
  ];

  const isUserRejection = userRejectionPatterns.some(
    (pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
      errorName.toLowerCase().includes(pattern.toLowerCase()) ||
      errorStr.toLowerCase().includes(pattern.toLowerCase())
  );

  if (isUserRejection) {
    console.info('Action not confirmed');
    return { message: 'Action not confirmed', isUserRejection: true };
  }

  // Parse contract revert errors
  if (errorMessage.includes('IncorrectAnswer') || errorMessage.includes('incorrect answer')) {
    return { message: 'Incorrect answer, try again', isUserRejection: false };
  }

  if (errorMessage.includes('NotStarted') || errorMessage.includes('not started')) {
    return { message: 'Please start the hunt first', isUserRejection: false };
  }

  if (errorMessage.includes('AlreadyCompleted') || errorMessage.includes('already completed')) {
    return { message: 'You have already completed this hunt', isUserRejection: false };
  }

  if (errorMessage.includes('HuntNotActive') || errorMessage.includes('hunt not active')) {
    return { message: 'This hunt is not active', isUserRejection: false };
  }

  // Handle gas estimation / simulation failures
  // These often show misleading "insufficient balance" messages
  if (
    errorMessage.includes('gas required exceeds allowance') ||
    errorMessage.includes('intrinsic gas too low') ||
    errorMessage.includes('execution reverted') ||
    errorMessage.includes('EstimateGasExecutionError')
  ) {
    // Extract the actual revert reason if available
    const revertMatch = errorMessage.match(/reverted with reason string '([^']+)'/);
    if (revertMatch) {
      return { message: revertMatch[1], isUserRejection: false };
    }

    // Check if it's a simulation error that might be hiding the real issue
    if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance')) {
      // This might be a false positive from simulation - return generic message
      return { message: 'Transaction failed - please try again', isUserRejection: false };
    }

    return { message: 'Transaction failed - please try again', isUserRejection: false };
  }

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('ECONNREFUSED')
  ) {
    return { message: 'Network error - please check your connection', isUserRejection: false };
  }

  // Chain switch errors
  if (errorMessage.includes('switch') && errorMessage.includes('chain')) {
    return { message: 'Please switch to Celo Mainnet to continue', isUserRejection: false };
  }

  // Extract clean message without stack trace
  let cleanMessage = errorMessage;

  // Remove stack traces
  const stackIndex = cleanMessage.indexOf('\n    at ');
  if (stackIndex !== -1) {
    cleanMessage = cleanMessage.substring(0, stackIndex);
  }

  // Remove "Error: " prefix if present
  cleanMessage = cleanMessage.replace(/^Error:\s*/i, '');

  // Remove contract error prefixes
  cleanMessage = cleanMessage.replace(/^ContractFunctionExecutionError:\s*/i, '');
  cleanMessage = cleanMessage.replace(/^TransactionExecutionError:\s*/i, '');

  // Truncate very long messages
  if (cleanMessage.length > 150) {
    cleanMessage = cleanMessage.substring(0, 147) + '...';
  }

  // Default fallback
  if (!cleanMessage || cleanMessage.trim() === '') {
    cleanMessage = 'Transaction failed';
  }

  return { message: cleanMessage, isUserRejection: false };
}

/**
 * Convenience function to get just the error message
 */
export function getErrorMessage(error: unknown): string {
  return parseTransactionError(error).message;
}

/**
 * Check if an error is a user rejection
 */
export function isUserRejectionError(error: unknown): boolean {
  return parseTransactionError(error).isUserRejection;
}

