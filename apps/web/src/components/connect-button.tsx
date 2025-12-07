"use client"

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { useMiniApp } from '@/contexts/miniapp-context'
import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Copy, Check, ExternalLink, Wallet, AlertCircle } from 'lucide-react'
import { CELO_MAINNET_CHAIN_ID } from '@/lib/contract-abis'
import { celo } from 'wagmi/chains'

export function WalletConnectButton({ mobileView }: { mobileView?: boolean }) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { context } = useMiniApp()
  
  const isOnCeloMainnet = chainId === CELO_MAINNET_CHAIN_ID

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleViewOnExplorer = () => {
    if (address) {
      window.open(`https://celoscan.io/address/${address}`, '_blank')
    }
  }

  const handleConnect = (connector: any) => {
    connect({ connector })
    setShowDialog(false)
  }

  // Get available connectors, excluding Farcaster for the main dialog
  const availableConnectors = connectors.filter(c => c.id !== 'farcaster')
  const farcasterConnector = connectors.find(c => c.id === 'farcaster')

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="border-2 animate-pulse">
        <Wallet className="h-4 w-4 mr-2" />
        Connect Wallet
      </Button>
    )
  }

  if (!isConnected) {
    return (
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="border-2 transition-premium hover-lift"
          >
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Choose a wallet to connect to PathFinderX on Celo Mainnet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {farcasterConnector && (
              <Button
                onClick={() => handleConnect(farcasterConnector)}
                className="w-full border-4 transition-premium hover-lift justify-start h-auto py-4"
                variant="outline"
              >
                <Wallet className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="text-body-bold">Farcaster</div>
                  <div className="text-sm text-celo-brown">Farcaster Mini App</div>
                </div>
              </Button>
            )}
            {availableConnectors.map((connector) => {
              const connectorName = connector.name || connector.id
              const isMetaMask = connectorName.toLowerCase().includes('metamask') || connector.id === 'metaMask'
              const isWalletConnect = connectorName.toLowerCase().includes('walletconnect') || connector.id === 'walletConnect'
              
              return (
                <Button
                  key={connector.id}
                  onClick={() => handleConnect(connector)}
                  className="w-full border-4 transition-premium hover-lift justify-start h-auto py-4"
                  variant="outline"
                >
                  <Wallet className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="text-body-bold">
                      {isMetaMask ? 'MetaMask' : isWalletConnect ? 'WalletConnect' : connectorName}
                    </div>
                    <div className="text-sm text-celo-brown">
                      {isMetaMask ? 'Browser Extension' : isWalletConnect ? 'Mobile & Desktop' : 'Connect'}
                    </div>
                  </div>
                </Button>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const handleSwitchToCelo = () => {
    if (switchChain) {
      switchChain({ chainId: CELO_MAINNET_CHAIN_ID })
    }
  }

  if (mobileView) {
    return (
      <div className="flex flex-col gap-3">
        {!isOnCeloMainnet && isConnected && (
          <Button
            onClick={handleSwitchToCelo}
            variant="destructive"
            size="sm"
            className="w-full border-2 transition-premium hover-lift"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Switch to Celo
          </Button>
        )}
        
        <div className="flex items-center gap-1 border-2 border-celo-purple bg-celo-tan-light px-3 py-2 transition-premium hover:border-celo-yellow">
          <Wallet className="h-4 w-4 text-celo-purple mr-2" />
          <span className="text-body-bold text-sm text-celo-purple flex-1">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
          </span>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-celo-purple hover:text-celo-yellow transition-all rounded"
            title="Copy address"
          >
            {copied ? (
              <Check className="h-3 w-3 text-celo-green" />
            ) : (
              <Copy className="h-3 w-3 text-celo-purple" />
            )}
          </button>
          <button
            onClick={handleViewOnExplorer}
            className="p-1 hover:bg-celo-purple hover:text-celo-yellow transition-all rounded"
            title="View on Celoscan"
          >
            <ExternalLink className="h-3 w-3 text-celo-purple" />
          </button>
        </div>

        <Button
          onClick={() => disconnect()}
          variant="outline"
          size="sm"
          className="w-full border-2 transition-premium hover-lift"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {!isOnCeloMainnet && isConnected && (
        <Button
          onClick={handleSwitchToCelo}
          variant="destructive"
          size="sm"
          className="border-2 transition-premium hover-lift"
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Switch to Celo
        </Button>
      )}
      
      <Button
        variant="secondary"
        size="sm"
        className={`border-2 transition-premium hover-lift ${isOnCeloMainnet ? '' : 'opacity-50'}`}
      >
        <Wallet className="h-4 w-4 mr-2" />
        {isOnCeloMainnet ? 'Celo' : `Chain ${chainId}`}
      </Button>

      <div className="flex items-center gap-1 border-2 border-celo-purple bg-celo-tan-light px-3 py-2 transition-premium hover:border-celo-yellow">
        <span className="text-body-bold text-sm text-celo-purple">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
        </span>
        <button
          onClick={handleCopy}
          className="ml-2 p-1 hover:bg-celo-purple hover:text-celo-yellow transition-all rounded"
          title="Copy address"
        >
          {copied ? (
            <Check className="h-3 w-3 text-celo-green" />
          ) : (
            <Copy className="h-3 w-3 text-celo-purple" />
          )}
        </button>
        <button
          onClick={handleViewOnExplorer}
          className="p-1 hover:bg-celo-purple hover:text-celo-yellow transition-all rounded"
          title="View on Celoscan"
        >
          <ExternalLink className="h-3 w-3 text-celo-purple" />
        </button>
      </div>

      <Button
        onClick={() => disconnect()}
        variant="outline"
        size="sm"
        className="border-2 transition-premium hover-lift"
      >
        Disconnect
      </Button>
    </div>
  )
}
