# Cross-Chain Asset Swap Protocol on ICP

A decentralized, trustless cross-chain asset swap protocol built on the Internet Computer Protocol (ICP) that enables seamless swaps between Bitcoin, Ethereum, and ICP without centralized exchanges or wrapped tokens.

## 🚀 Features

- **Trustless Cross-Chain Swaps**: No intermediaries or wrapped tokens required
- **Native Blockchain Integration**: Direct Bitcoin and Ethereum transaction signing via ICP's Chain-Key cryptography
- **Atomic Swaps**: Using Hash Time Lock Contracts (HTLCs) and zk-SNARKs
- **Multi-Wallet Support**: Compatible with Plug, MetaMask, and Hiro wallets
- **Real-Time Tracking**: Visual dashboard showing swap progress from initiation to completion
- **Low Fees**: Optimized fee routing and minimal transaction costs
- **High Throughput**: Built for DeFi scalability

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Bitcoin       │    │   Ethereum      │    │      ICP        │
│   Network       │◄──►│   Network       │◄──►│   Canisters     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                               ┌─────────────────┐
                                               │  Frontend App   │
                                               │  (React.js)     │
                                               └─────────────────┘
```

### Core Components

1. **ICP Canister Backend**: Rust-based smart contracts managing swap logic
2. **Ethereum Smart Contracts**: HTLC implementation for Ethereum-side locks
3. **React Frontend**: User interface for initiating and monitoring swaps
4. **Chain-Key Integration**: Native cross-chain transaction signing

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [Rust](https://rustup.rs/) (latest stable)
- [DFX](https://internetcomputer.org/docs/current/developer-docs/setup/install/) (latest version)
- [Hardhat](https://hardhat.org/) for Ethereum development
- Wallet extensions: Plug, MetaMask, or Hiro

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cross-chain-swap.git
cd cross-chain-swap
```

### 2. Install Dependencies

#### Backend (ICP Canister)
```bash
cd src/backend
cargo build
```

#### Frontend
```bash
cd src/frontend
npm install
```

#### Ethereum Contracts
```bash
cd ethereum
npm install
```

### 3. Local Development Setup

#### Start Local ICP Replica
```bash
dfx start --clean --background
```

#### Deploy Canister
```bash
dfx deploy cross_chain_swap
```

#### Start Ethereum Local Node
```bash
cd ethereum
npx hardhat node
```

#### Deploy Ethereum Contracts
```bash
cd ethereum
npx hardhat run scripts/deploy.js --network localhost
```

#### Start Frontend
```bash
cd src/frontend
npm start
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in the respective directories:

#### Frontend (.env)
```
REACT_APP_CANISTER_ID=your_canister_id
REACT_APP_ETHEREUM_RPC_URL=http://localhost:8545
REACT_APP_ETHEREUM_CHAIN_ID=1337
```

#### Ethereum (.env)
```
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID
ETHERSCAN_API_KEY=your_etherscan_api_key
```

## 📖 Usage

### Initiating a Cross-Chain Swap

1. **Connect Wallet**: Connect your preferred wallet (Plug for ICP, MetaMask for Ethereum)
2. **Select Chains**: Choose source and destination chains
3. **Enter Amount**: Specify the amount to swap
4. **Set Parameters**: Configure timelock duration and recipient address
5. **Initiate Swap**: Sign the transaction to create the HTLC
6. **Monitor Progress**: Track the swap status in real-time

### Completing a Swap

1. **Reveal Secret**: The recipient reveals the secret to unlock funds
2. **Automatic Execution**: Smart contracts automatically complete the swap
3. **Confirmation**: Both parties receive confirmation of successful swap

### Refunding a Swap

If the swap isn't completed before the timelock expires:
1. **Timelock Expiry**: Wait for the timelock period to pass
2. **Refund Request**: Original sender can request a refund
3. **Automatic Refund**: Funds are returned to the original sender

## 🔐 Security Features

- **Hash Time Lock Contracts**: Ensure atomic swaps or automatic refunds
- **Chain-Key Cryptography**: Secure cross-chain transaction signing
- **Multi-Signature Support**: Enhanced security for large transactions
- **Audit Trail**: Complete transaction history and verification
- **Emergency Stops**: Admin controls for critical situations

## 🧪 Testing

### Run Backend Tests
```bash
cd src/backend
cargo test
```

### Run Ethereum Contract Tests
```bash
cd ethereum
npx hardhat test
```

### Run Frontend Tests
```bash
cd src/frontend
npm test
```

### Integration Tests
```bash
./scripts/integration-test.sh
```

## 🚀 Deployment

### Mainnet Deployment

#### Deploy to IC Mainnet
```bash
dfx deploy --network ic cross_chain_swap
```

#### Deploy to Ethereum Mainnet
```bash
cd ethereum
npx hardhat run scripts/deploy.js --network mainnet
```

#### Build and Deploy Frontend
```bash
cd src/frontend
npm run build
dfx deploy --network ic frontend
```

## 📊 Supported Assets

### Current Support
- **Bitcoin (BTC)**: Native Bitcoin transactions
- **Ethereum (ETH)**: Native Ethereum transactions
- **ICP**: Internet Computer Protocol tokens
- **ERC-20 Tokens**: Popular Ethereum-based tokens

### Planned Support
- **Wrapped Bitcoin (WBTC)**
- **USD Stablecoins (USDC, USDT)**
- **Other Layer 1 Blockchains**

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](https://docs.cross-chain-swap.com)
- [API Reference](https://api.cross-chain-swap.com)
- [Discord Community](https://discord.gg/cross-chain-swap)
- [Twitter](https://twitter.com/CrossChainSwap)

## ⚠️ Disclaimer

This is experimental software. Use at your own risk. Always verify transaction details before proceeding with swaps.

## 🙏 Acknowledgments

- Internet Computer Protocol team for Chain-Key cryptography
- OpenZeppelin for smart contract security standards
- Hardhat team for development tools
- React team for the frontend framework

---

**Built with ❤️ on the Internet Computer**