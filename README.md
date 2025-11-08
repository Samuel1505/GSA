# GSA - Crypto Prediction Market Platform

A decentralized prediction market platform built on Base Sepolia that enables users to create and participate in crypto-related prediction markets with gasless transactions powered by Thirdweb's Account Abstraction.

## 🌟 Overview

GSA (Gasless Smart Account) is a full-stack Web3 application that combines smart contracts, a gasless transaction relayer, and a modern Next.js frontend to provide a seamless prediction market experience. Users can create markets, make predictions, and earn rewards without worrying about gas fees.

### Key Features

- **🎯 Prediction Markets**: Create and participate in crypto prediction markets
- **💸 Gasless Transactions**: Zero gas fees for users via Thirdweb Smart Wallets (ERC-4337)
- **🏆 Gamification**: Streaks, achievements, leaderboards, and points system
- **📊 User Dashboard**: Track predictions, winnings, and performance metrics
- **🔒 Secure & Transparent**: Built on Ethereum (Base Sepolia testnet)
- **⚡ Real-time Updates**: Live market data and user statistics
- **🎨 Modern UI**: Beautiful, responsive design with Tailwind CSS v4

## 🏗️ Architecture

The project consists of three main components:

```
GSA/
├── frontend/          # Next.js 16 + React 19 application
├── backend/           # Express.js meta-transaction relayer
└── smartcontract/     # Solidity smart contracts (Hardhat)
```

### Technology Stack

#### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Web3**: 
  - Thirdweb SDK v5 (Smart Wallets, Account Abstraction)
  - Wagmi v2 (Ethereum interactions)
  - Viem v2 (Ethereum utilities)
  - Ethers.js v6
- **State Management**: React Context + TanStack Query
- **Wallet Connection**: Reown AppKit (WalletConnect v2)
- **Notifications**: React Toastify
- **Icons**: Lucide React

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Web3**: Ethers.js v6
- **Environment**: dotenv

#### Smart Contracts
- **Language**: Solidity ^0.8.19
- **Framework**: Hardhat v2
- **Libraries**: OpenZeppelin Contracts v5
- **Testing**: Chai, Mocha, Hardhat Network Helpers
- **Deployment**: Hardhat Ignition

## 📋 Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Base Sepolia testnet ETH (for contract deployment)
- Thirdweb API key (for gasless transactions)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd GSA
```

### 2. Smart Contract Setup

```bash
cd smartcontract
npm install

# Configure environment variables
cp .env.example .env
# Add your private key and RPC URL to .env

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Base Sepolia
npx hardhat ignition deploy ./ignition/modules/Prediction.ts --network baseSepolia
```

**Important**: Note the deployed contract address for frontend configuration.

### 3. Backend Setup (Meta-Transaction Relayer)

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` and add:
```env
PORT=3001
RPC_URL=https://sepolia.base.org
RELAYER_PRIVATE_KEY=your_relayer_private_key
FORWARDER_ADDRESS=your_forwarder_contract_address
```

Start the relayer:
```bash
node src/relayer.js
```

The relayer will run on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend
npm install

# Configure environment variables
cp .env.example .env.local
```

Edit `.env.local` and add:
```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_RELAYER_URL=http://localhost:3001
```

**Get Thirdweb Client ID**:
1. Visit [Thirdweb Dashboard](https://thirdweb.com/dashboard)
2. Create a new project
3. Copy your Client ID
4. Enable gas sponsorship for Base Sepolia

Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

### Frontend (`/frontend`)

```
frontend/
├── app/
│   ├── config/           # Thirdweb and app configuration
│   ├── context/          # React Context providers
│   ├── create/           # Create market page
│   ├── dashboard/        # User dashboard
│   ├── markets/          # Market listing and details
│   ├── setup-wallet/     # Smart wallet setup
│   ├── wallet/           # Wallet management
│   ├── ABIs/             # Contract ABIs
│   ├── globals.css       # Global styles and Tailwind config
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Landing page
├── components/           # Reusable React components
│   ├── Header.tsx
│   ├── Hero.tsx
│   ├── Stats.tsx
│   ├── HowItWorks.tsx
│   ├── ActiveMarkets.tsx
│   ├── WhyChooseUs.tsx
│   ├── Footer.tsx
│   ├── SmartWalletGuard.tsx
│   └── ...
└── public/              # Static assets (images, icons)
```

### Backend (`/backend`)

```
backend/
├── src/
│   ├── config/
│   │   └── env.js       # Environment configuration
│   ├── abi/             # Contract ABIs
│   └── relayer.js       # Meta-transaction relayer service
├── sign.js              # Signature utilities
└── sign-test.js         # Signature testing
```

### Smart Contracts (`/smartcontract`)

```
smartcontract/
├── contracts/
│   ├── Prediction.sol   # Main prediction market contract
│   └── Lock.sol         # Sample contract
├── ignition/
│   └── modules/         # Deployment scripts
├── scripts/             # Utility scripts
├── test/                # Contract tests
└── hardhat.config.ts    # Hardhat configuration
```

## 🎮 Core Features

### 1. Prediction Markets

Users can create prediction markets with:
- Custom questions and options
- Entry fees and prize pools
- End times and resolution periods
- Automatic prize distribution

### 2. Smart Wallet Integration

- **Gasless Transactions**: Users don't pay gas fees
- **Account Abstraction**: ERC-4337 smart wallets via Thirdweb
- **Seamless Onboarding**: Create wallet with any EOA
- **Sponsored Gas**: Platform sponsors all transaction costs

### 3. User Statistics & Gamification

- **Streaks**: Track consecutive correct predictions
- **Achievements**: Unlock badges and milestones
- **Leaderboards**: Compete with other users
- **Points System**: Earn points for participation
- **Win Rate**: Track prediction accuracy

### 4. Dashboard

Personal dashboard showing:
- Active bets and bet history
- Total predictions and win rate
- Total winnings and wallet balance
- Current and longest streaks
- Recent activity feed
- Achievements and badges

## 🔐 Smart Contract Features

The `PrizePoolPrediction.sol` contract includes:

- **Market Creation**: Anyone can create prediction markets
- **Entry Fees**: Configurable entry fees in ETH
- **Prize Pools**: Initial prize pool + accumulated entry fees
- **Time-based Resolution**: Markets close and resolve at specified times
- **Winner Distribution**: Automatic prize distribution to winners
- **User Stats**: On-chain tracking of user performance
- **Streak System**: Consecutive win tracking with streak savers
- **Dispute Mechanism**: Challenge incorrect resolutions
- **Platform Fees**: 5% platform fee on prize pools
- **Reentrancy Protection**: OpenZeppelin ReentrancyGuard

### Key Contract Functions

```solidity
// Create a new prediction market
function createPrediction(
    string memory question,
    string[] memory options,
    uint256 entryFee,
    uint256 endTime,
    uint256 resolutionTime
) external payable

// Submit a prediction
function submitPrediction(uint256 predictionId, uint256 option) external payable

// Resolve a market (creator only)
function resolvePrediction(uint256 predictionId, uint256 winningOption) external

// Claim winnings
function claimPrize(uint256 predictionId) external

// Get user statistics
function getUserStats(address user) external view returns (UserStats memory)
```

## 🌐 Deployment

### Smart Contract Deployment

The contract is deployed on **Base Sepolia** testnet:
- Network: Base Sepolia
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Contract Address: `0xbc371b61052B4811424643cA41E9A4aFC94dc58e`

### Frontend Deployment

Deploy to Vercel:

```bash
cd frontend
vercel deploy
```

Or build for production:

```bash
npm run build
npm run start
```

### Backend Deployment

Deploy the relayer to any Node.js hosting service (Railway, Render, Heroku, etc.):

```bash
cd backend
# Set environment variables on your hosting platform
# Deploy using your platform's CLI or Git integration
```

## 🧪 Testing

### Smart Contract Tests

```bash
cd smartcontract
npx hardhat test
```

Run with gas reporting:
```bash
REPORT_GAS=true npx hardhat test
```

### Frontend Testing

```bash
cd frontend
npm run lint
```

## 🔧 Configuration

### Thirdweb Configuration

Edit `frontend/app/config/thirdweb.ts`:

```typescript
export const client = createThirdwebClient({
  clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

export const chain = baseSepolia;

export const CONTRACT_ADDRESS = "0xbc371b61052B4811424643cA41E9A4aFC94dc58e";
```

### Tailwind Configuration

The project uses Tailwind CSS v4 with custom theme in `frontend/app/globals.css`:

```css
:root {
  --color-cosmic-dark: #0a0a0a;
  --color-cosmic-purple: #6366f1;
  --color-cosmic-blue: #3b82f6;
  --color-text-muted: #9ca3af;
}
```

## 📱 User Flow

1. **Connect Wallet**: User connects with MetaMask or any Web3 wallet
2. **Create Smart Wallet**: One-time setup of gasless smart wallet
3. **Browse Markets**: Explore active prediction markets
4. **Make Predictions**: Submit predictions (gasless!)
5. **Track Performance**: Monitor predictions in dashboard
6. **Claim Rewards**: Claim winnings from successful predictions
7. **Earn Achievements**: Unlock badges and climb leaderboards

## 🛠️ Development

### Running Locally

Terminal 1 - Smart Contract (optional, for testing):
```bash
cd smartcontract
npx hardhat node
```

Terminal 2 - Backend Relayer:
```bash
cd backend
node src/relayer.js
```

Terminal 3 - Frontend:
```bash
cd frontend
npm run dev
```

### Environment Variables

Create `.env` files in each directory:

**smartcontract/.env**:
```env
PRIVATE_KEY=your_deployer_private_key
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASESCAN_API_KEY=your_basescan_api_key
```

**backend/.env**:
```env
PORT=3001
RPC_URL=https://sepolia.base.org
RELAYER_PRIVATE_KEY=your_relayer_private_key
FORWARDER_ADDRESS=your_forwarder_contract_address
```

**frontend/.env.local**:
```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_CONTRACT_ADDRESS=0xbc371b61052B4811424643cA41E9A4aFC94dc58e
NEXT_PUBLIC_RELAYER_URL=http://localhost:3001
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Thirdweb Documentation](https://portal.thirdweb.com/)
- [Base Documentation](https://docs.base.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Wagmi Documentation](https://wagmi.sh/)

## 🐛 Known Issues

- Smart wallet creation requires initial EOA connection
- Gas sponsorship limits may apply based on Thirdweb plan
- Market resolution is manual (creator-initiated)

## 🚧 Roadmap

- [ ] Automated market resolution via Chainlink oracles
- [ ] Multi-chain support (Ethereum, Polygon, Arbitrum)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and charts
- [ ] Social features (comments, sharing)
- [ ] NFT rewards for achievements
- [ ] DAO governance for platform decisions

## 💬 Support

For questions or issues:
- Open an issue on GitHub
- Check existing documentation
- Review smart contract code and tests

## 🙏 Acknowledgments

- Thirdweb for Account Abstraction infrastructure
- Base for the L2 network
- OpenZeppelin for secure smart contract libraries
- The Web3 community for inspiration and support

---

**Built with ❤️ for the decentralized future**