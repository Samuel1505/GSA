# Thirdweb Smart Wallet Setup Guide

This project now uses **Thirdweb Smart Wallets** with **sponsored gas fees**! Users can interact with your dApp without paying gas fees.

## What's Changed

### ✅ Implemented Features

1. **Smart Wallets**: Users get ERC-4337 smart wallets automatically created
2. **Sponsored Gas**: Thirdweb sponsors all gas fees for transactions
3. **Multiple Connection Options**:
   - Email/Social login (in-app wallet)
   - MetaMask (wrapped in smart wallet)
   - Smart wallet auto-creation

### 📁 Files Modified

- `app/config/thirdweb.ts` - Thirdweb client and wallet configuration
- `app/context/index.tsx` - Added ThirdwebProvider
- `components/Header.tsx` - Updated to use Thirdweb ConnectButton
- `app/dashboard/page.tsx` - Updated to use Thirdweb hooks and contract reads
- `app/create/page.tsx` - Updated transactions to use gasless smart wallets
- `app/markets/[id]/page.tsx` - Updated transactions to use gasless smart wallets

## Setup Instructions

### 1. Get Your Thirdweb Client ID

1. Go to [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Sign up or log in
3. Create a new project or use an existing one
4. Copy your **Client ID** from the project settings

### 2. Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
# Thirdweb Client ID (Required for gasless transactions)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id_here

# WalletConnect Project ID (existing)
NEXT_PUBLIC_PROJECT_ID=your_project_id_here
```

### 3. Install Dependencies

Dependencies are already installed, but if you need to reinstall:

```bash
cd frontend
npm install
```

### 4. Run the Application

```bash
npm run dev
```

## How It Works

### Smart Wallet Flow

1. **User Connects**: User clicks "Connect Wallet" in the header
2. **Wallet Selection**: User can choose:
   - Email/Social login (in-app wallet)
   - MetaMask (wrapped in smart wallet)
3. **Smart Wallet Creation**: If needed, a smart wallet is automatically created
4. **Gasless Transactions**: All transactions are sponsored by Thirdweb

### Transaction Flow

```typescript
// Example: Creating a prediction market (gasless!)
const transaction = prepareContractCall({
  contract,
  method: "function createPrediction(...)",
  params: [...],
  value: entryFee,
});

await sendTransaction({
  transaction,
  account, // Smart wallet account - gas is sponsored!
});
```

## Benefits

✅ **Zero Gas Fees for Users**: All transactions are sponsored  
✅ **Better UX**: Users don't need ETH to interact  
✅ **Email/Social Login**: Easier onboarding for new users  
✅ **Automatic Smart Wallet**: Created on-demand  
✅ **Backward Compatible**: Works with existing MetaMask users  

## Configuration

### Smart Wallet Settings

Located in `app/config/thirdweb.ts`:

```typescript
// Smart wallet with sponsored gas
export const smartWalletConfig = smartWallet({
  chain: baseSepolia,
  sponsorGas: true, // Thirdweb sponsors gas fees!
});

// In-app wallet with smart account
export const inAppWalletConfig = inAppWallet({
  smartAccount: {
    chain: baseSepolia,
    sponsorGas: true,
  },
});
```

## Important Notes

1. **Client ID Required**: Without a valid Client ID, gasless transactions won't work
2. **Network**: Currently configured for Base Sepolia (chainId: 84532)
3. **Gas Sponsorship**: Thirdweb sponsors gas fees (limits may apply based on your plan)
4. **Smart Wallet Deployment**: Smart wallets are deployed automatically on first use

## Troubleshooting

### "Please connect your wallet first"
- Make sure you've connected a wallet via the ConnectButton in the header

### "NEXT_PUBLIC_THIRDWEB_CLIENT_ID is not set"
- Add your Client ID to `.env.local` file
- Restart your dev server after adding the environment variable

### Transactions not working
- Verify your Client ID is correct
- Check that you're on the correct network (Base Sepolia)
- Ensure your Thirdweb account has gas sponsorship enabled

## Resources

- [Thirdweb Documentation](https://portal.thirdweb.com)
- [Smart Wallets Guide](https://thirdweb.com/learn/guides/thirdweb-smart-wallets-powered-by-account-abstraction-and-how-to-use-them)
- [Thirdweb Dashboard](https://thirdweb.com/dashboard)

