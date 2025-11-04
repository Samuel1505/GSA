'use client'

import { ReactNode } from 'react'
import { ThirdwebProvider } from "thirdweb/react";
// ... your other imports (wagmi, etc.)

export default function ContextProvider({ 
  children, 
  cookies 
}: { 
  children: ReactNode
  cookies: string | null 
}) {
  return (
    <ThirdwebProvider>
      {/* Your existing providers (wagmi, etc.) */}
      {children}
    </ThirdwebProvider>
  )
}