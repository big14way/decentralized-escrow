import React from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/WalletConnectButton.css';

const WalletConnectButton = () => {
  const { account, isConnecting, connect, disconnect, isConnected } = useWalletConnect();

  if (isConnected && account) {
    return (
      <div className="wallet-connected">
        <span className="wallet-address">
          {account.slice(0, 8)}...{account.slice(-6)}
        </span>
        <button onClick={disconnect} className="disconnect-btn">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className="connect-btn"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
};

export default WalletConnectButton;
