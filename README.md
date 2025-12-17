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
