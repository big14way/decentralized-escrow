# Decentralized Escrow Service

P2P escrow service with Hiro Chainhook integration for real-time event tracking, fee analytics, and user statistics.

## Clarity 4 Features

| Feature | Usage |
|---------|-------|
| `stacks-block-time` | Escrow expiration, timestamp tracking |
| `restrict-assets?` | Safe fund transfers |
| `to-ascii?` | Human-readable escrow info |

## Chainhook Integration

This project uses Hiro Chainhooks to track on-chain events in real-time:

### Events Tracked

| Event | Description | Data |
|-------|-------------|------|
| `escrow-created` | New escrow created | buyer, seller, amount, expires-at |
| `escrow-funded` | Escrow funded by buyer | escrow-id, amount |
| `escrow-released` | Funds released to seller | amount, fee |
| `escrow-disputed` | Dispute opened | disputer, reason |
| `dispute-resolved` | Arbiter resolved dispute | winner, arbiter-fee |
| `fee-collected` | Protocol fee collected | fee-type, amount |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Smart Contracts                           │
│  ┌────────────────────┐    ┌────────────────────┐          │
│  │  escrow-manager    │    │  escrow-analytics  │          │
│  │  - create-escrow   │    │  - daily-stats     │          │
│  │  - fund-escrow     │    │  - user-rankings   │          │
│  │  - release-escrow  │    │  - monthly-stats   │          │
│  │  - open-dispute    │    └────────────────────┘          │
│  │  - resolve-dispute │                                     │
│  │  print { event }   │ ← Emits events                     │
│  └────────────────────┘                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ Chainhook captures print events
┌─────────────────────────────────────────────────────────────┐
│                    Hiro Chainhook                            │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Predicate: print_event contains "event"           │     │
│  │  → POST to http://localhost:3001/api/escrow-events │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Chainhook Server                           │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Express.js + SQLite                               │     │
│  │  - Process events                                  │     │
│  │  - Update database                                 │     │
│  │  - Serve analytics API                             │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Analytics Dashboard                        │
│  GET /api/stats → Total escrows, volume, fees               │
│  GET /api/stats/daily → Daily metrics                       │
│  GET /api/users/:address → User stats                       │
│  GET /api/escrows → Recent escrows                          │
└─────────────────────────────────────────────────────────────┘
```

## Fee Structure

| Fee Type | Rate | When Applied |
|----------|------|--------------|
| Release Fee | 1% | On successful release |
| Dispute Fee | 2% | On dispute resolution |

## Setup

### 1. Deploy Smart Contracts

```bash
cd decentralized-escrow
clarinet check
clarinet test

# Deploy to testnet
clarinet deployments generate --testnet
clarinet deployments apply -p deployments/default.testnet-plan.yaml
```

### 2. Configure Chainhooks

Edit `chainhooks/escrow-events.json`:
- Replace `YOUR_DEPLOYER_ADDRESS` with your deployed contract address
- Replace `YOUR_AUTH_TOKEN` with a secure token

### 3. Start Chainhook Server

```bash
cd server
npm install
npm start
```

### 4. Register Chainhook with Hiro Platform

Upload `chainhooks/escrow-events.json` to Hiro Platform or run locally:

```bash
chainhook predicates scan ./chainhooks/escrow-events.json --testnet
```

## API Endpoints

### Analytics

```bash
# Get overall stats
GET /api/stats

# Get daily stats (last 30 days)
GET /api/stats/daily?days=30

# Get user stats
GET /api/users/{address}

# Get top users by volume
GET /api/users/top/volume?limit=10
```

### Escrows

```bash
# Get escrow details
GET /api/escrows/{id}

# Get recent escrows
GET /api/escrows?status=funded&limit=20

# Get fee history
GET /api/fees?limit=50
```

## Contract Functions

### Create Escrow

```clarity
(create-escrow 
    (seller principal)
    (amount uint)
    (description (string-ascii 256))
    (duration uint))
```

### Fund & Release

```clarity
(fund-escrow (escrow-id uint))
(release-escrow (escrow-id uint))
(refund-escrow (escrow-id uint))
```

### Disputes

```clarity
(open-dispute (escrow-id uint) (reason (string-ascii 256)))
(resolve-dispute (escrow-id uint) (winner principal))
```

## Example Usage

```typescript
// Create escrow for 100 STX, 7-day duration
const escrowId = await createEscrow({
    seller: 'ST...',
    amount: 100000000,
    description: "MacBook Pro purchase",
    duration: 604800
});

// Buyer funds escrow
await fundEscrow(escrowId);

// Buyer confirms delivery, releases funds
await releaseEscrow(escrowId);
// Seller receives 99 STX (1% fee)
```

## Chainhook Event Payload

When an escrow is created, Chainhook receives:

```json
{
  "apply": [{
    "transactions": [{
      "metadata": {
        "receipt": {
          "events": [{
            "type": "SmartContractEvent",
            "data": {
              "value": {
                "event": "escrow-created",
                "escrow-id": 1,
                "buyer": "ST...",
                "seller": "ST...",
                "amount": 100000000,
                "timestamp": 1699999999
              }
            }
          }]
        }
      }
    }]
  }]
}
```

## License

MIT License

## Testnet Deployment

### escrow-arbitration
- **Status**: ✅ Deployed to Testnet
- **Transaction ID**: `667b0ed1abb44c2410edfb18820ba7276117612f4fd4560bc6cb1bcdaf3af2bc`
- **Deployer**: `ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM`
- **Explorer**: https://explorer.hiro.so/txid/667b0ed1abb44c2410edfb18820ba7276117612f4fd4560bc6cb1bcdaf3af2bc?chain=testnet
- **Deployment Date**: December 22, 2025

### Network Configuration
- Network: Stacks Testnet
- Clarity Version: 4
- Epoch: 3.3
- Chainhooks: Configured and ready

### Contract Features
- Comprehensive validation and error handling
- Event emission for Chainhook monitoring
- Fully tested with `clarinet check`
- Production-ready security measures

## WalletConnect Integration

This project includes a fully-functional React dApp with WalletConnect v2 integration for seamless interaction with Stacks blockchain wallets.

### Features

- **🔗 Multi-Wallet Support**: Connect with any WalletConnect-compatible Stacks wallet
- **✍️ Transaction Signing**: Sign messages and submit transactions directly from the dApp
- **📝 Contract Interactions**: Call smart contract functions on Stacks testnet
- **🔐 Secure Connection**: End-to-end encrypted communication via WalletConnect relay
- **📱 QR Code Support**: Easy mobile wallet connection via QR code scanning

### Quick Start

#### Prerequisites

- Node.js (v16.x or higher)
- npm or yarn package manager
- A Stacks wallet (Xverse, Leather, or any WalletConnect-compatible wallet)

#### Installation

```bash
cd dapp
npm install
```

#### Running the dApp

```bash
npm start
```

The dApp will open in your browser at `http://localhost:3000`

#### Building for Production

```bash
npm run build
```

### WalletConnect Configuration

The dApp is pre-configured with:

- **Project ID**: 1eebe528ca0ce94a99ceaa2e915058d7
- **Network**: Stacks Testnet (Chain ID: `stacks:2147483648`)
- **Relay**: wss://relay.walletconnect.com
- **Supported Methods**:
  - `stacks_signMessage` - Sign arbitrary messages
  - `stacks_stxTransfer` - Transfer STX tokens
  - `stacks_contractCall` - Call smart contract functions
  - `stacks_contractDeploy` - Deploy new smart contracts

### Project Structure

```
dapp/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── WalletConnectButton.js      # Wallet connection UI
│   │   └── ContractInteraction.js       # Contract call interface
│   ├── contexts/
│   │   └── WalletConnectContext.js     # WalletConnect state management
│   ├── hooks/                            # Custom React hooks
│   ├── utils/                            # Utility functions
│   ├── config/
│   │   └── stacksConfig.js             # Network and contract configuration
│   ├── styles/                          # CSS styling
│   ├── App.js                           # Main application component
│   └── index.js                         # Application entry point
└── package.json
```

### Usage Guide

#### 1. Connect Your Wallet

Click the "Connect Wallet" button in the header. A QR code will appear - scan it with your mobile Stacks wallet or use the desktop wallet extension.

#### 2. Interact with Contracts

Once connected, you can:

- View your connected address
- Call read-only contract functions
- Submit contract call transactions
- Sign messages for authentication

#### 3. Disconnect

Click the "Disconnect" button to end the WalletConnect session.

### Customization

#### Updating Contract Configuration

Edit `src/config/stacksConfig.js` to point to your deployed contracts:

```javascript
export const CONTRACT_CONFIG = {
  contractName: 'your-contract-name',
  contractAddress: 'YOUR_CONTRACT_ADDRESS',
  network: 'testnet' // or 'mainnet'
};
```

#### Adding Custom Contract Functions

Modify `src/components/ContractInteraction.js` to add your contract-specific functions:

```javascript
const myCustomFunction = async () => {
  const result = await callContract(
    CONTRACT_CONFIG.contractAddress,
    CONTRACT_CONFIG.contractName,
    'your-function-name',
    [functionArgs]
  );
};
```

### Technical Details

#### WalletConnect v2 Implementation

The dApp uses the official WalletConnect v2 Sign Client with:

- **@walletconnect/sign-client**: Core WalletConnect functionality
- **@walletconnect/utils**: Helper utilities for encoding/decoding
- **@walletconnect/qrcode-modal**: QR code display for mobile connection
- **@stacks/connect**: Stacks-specific wallet integration
- **@stacks/transactions**: Transaction building and signing
- **@stacks/network**: Network configuration for testnet/mainnet

#### BigInt Serialization

The dApp includes BigInt serialization support for handling large numbers in Clarity contracts:

```javascript
BigInt.prototype.toJSON = function() { return this.toString(); };
```

### Supported Wallets

Any wallet supporting WalletConnect v2 and Stacks blockchain, including:

- **Xverse Wallet** (Recommended)
- **Leather Wallet** (formerly Hiro Wallet)
- **Boom Wallet**
- Any other WalletConnect-compatible Stacks wallet

### Troubleshooting

**Connection Issues:**
- Ensure your wallet app supports WalletConnect v2
- Check that you're on the correct network (testnet vs mainnet)
- Try refreshing the QR code or restarting the dApp

**Transaction Failures:**
- Verify you have sufficient STX for gas fees
- Confirm the contract address and function names are correct
- Check that post-conditions are properly configured

**Build Errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Ensure Node.js version is 16.x or higher
- Check for dependency conflicts in package.json

### Resources

- [WalletConnect Documentation](https://docs.walletconnect.com/)
- [Stacks.js Documentation](https://docs.stacks.co/build-apps/stacks.js)
- [Xverse WalletConnect Guide](https://docs.xverse.app/wallet-connect)
- [Stacks Blockchain Documentation](https://docs.stacks.co/)

### Security Considerations

- Never commit your private keys or seed phrases
- Always verify transaction details before signing
- Use testnet for development and testing
- Audit smart contracts before mainnet deployment
- Keep dependencies updated for security patches

### License

This dApp implementation is provided as-is for integration with the Stacks smart contracts in this repository.

