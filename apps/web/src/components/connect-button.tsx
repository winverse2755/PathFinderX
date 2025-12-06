"use client"

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useMiniApp } from '@/contexts/miniapp-context'
import { Button } from './ui/button'

export function WalletConnectButton() {
  const [mounted, setMounted] = useState(false)
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { context } = useMiniApp()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="sm">
        Connect Wallet
      </Button>
    )
  }

  if (!isConnected) {
    const farcasterConnector = connectors.find(connector => connector.id === 'farcaster')
    
    return (
      <Button
        onClick={() => farcasterConnector && connect({ connector: farcasterConnector })}
        variant="outline"
        size="sm"
      >
        Connect Wallet
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
      >
        Celo
      </Button>

      <Button
        onClick={() => disconnect()}
        variant="outline"
        size="sm"
      >
        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
      </Button>
    </div>
  )
}
