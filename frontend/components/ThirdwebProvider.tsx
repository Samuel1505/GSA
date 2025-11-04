"use client";

import { ThirdwebProvider } from "thirdweb/react";
import { client } from "../app/lib/thirdweb";

export function ThirdwebProviderWrapper({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <ThirdwebProvider>
      {children}
    </ThirdwebProvider>
  );
}