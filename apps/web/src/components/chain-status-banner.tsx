"use client"

import { useChainId, useSwitchChain } from 'wagmi'
import { useAccount } from 'wagmi'
import { CELO_MAINNET_CHAIN_ID } from '@/lib/contract-abis'
import { Button } from './ui/button'
import { AlertCircle, X } from 'lucide-react'
import { useState } from 'react'

export function ChainStatusBanner() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [dismissed, setDismissed] = useState(false)
  
  const isOnCeloMainnet = chainId === CELO_MAINNET_CHAIN_ID
  
  if (!isConnected || isOnCeloMainnet || dismissed) {
    return null
  }

  const handleSwitch = () => {
    if (switchChain) {
      switchChain({ chainId: CELO_MAINNET_CHAIN_ID })
    }
  }

  return (
    <div className="w-full border-b-4 border-celo-orange bg-celo-orange/20 p-4 animate-fade-in">
      <div className="container mx-auto max-w-7xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-celo-orange flex-shrink-0" />
          <div>
            <p className="text-body-bold text-celo-purple">
              Wrong Network
            </p>
            <p className="text-sm text-celo-brown">
              Please switch to Celo Mainnet to use PathFinderX. Transactions require cUSD on Celo.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSwitch}
            variant="outline"
            size="sm"
            className="border-2 border-celo-orange text-celo-purple hover:bg-celo-orange hover:text-celo-yellow transition-premium"
          >
            Switch to Celo
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-celo-orange/20 rounded transition-all"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 text-celo-purple" />
          </button>
        </div>
      </div>
    </div>
  )
}

