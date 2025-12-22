export const WALLET_CONNECT_PROJECT_ID = '1eebe528ca0ce94a99ceaa2e915058d7';

export const NETWORK_CONFIG = {
  mainnet: {
    chainId: 'stacks:1',
    url: 'https://api.mainnet.hiro.so',
    wsUrl: 'wss://relay.walletconnect.com'
  },
  testnet: {
    chainId: 'stacks:2147483648',
    url: 'https://api.testnet.hiro.so',
    wsUrl: 'wss://relay.walletconnect.com'
  }
};

export const CONTRACT_CONFIG = {
  contractName: 'escrow-arbitration',
  contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  network: 'testnet'
};

export const APP_METADATA = {
  name: 'Decentralized Escrow',
  description: 'Stacks dApp with WalletConnect integration',
  url: 'https://your-app-url.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};
