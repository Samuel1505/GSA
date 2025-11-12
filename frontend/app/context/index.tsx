'use client'

import React, { type ReactNode } from 'react'
import { ThirdwebProvider } from 'thirdweb/react'

/**
 * Simplified Context Provider - Thirdweb Only
 * Removed WalletConnect/Reown to avoid conflicts
 */
interface ContextProviderProps {
  children: ReactNode
  cookies?: string | null // Optional for compatibility, but not used
}

function ContextProvider({ children }: ContextProviderProps) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  )
}

export default ContextProvider