import React, { useState, useEffect } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/WalletManager.css';

const WalletManager = () => {
  const { account, userData, connectWallet, disconnectWallet } = useWalletConnect();
  const [isOpen, setIsOpen] = useState(false);
  const [connectionHistory, setConnectionHistory] = useState([]);
  const [detectedWallets, setDetectedWallets] = useState([]);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const supportedWallets = [
    {
      id: 'hiro',
      name: 'Hiro Wallet',
      icon: '🦊',
      description: 'Official Stacks wallet with full feature support',
      downloadUrl: 'https://wallet.hiro.so/',
      detectionKey: 'StacksProvider'
    },
    {
      id: 'xverse',
      name: 'Xverse',
      icon: '💎',
      description: 'Multi-chain wallet with Bitcoin and Stacks support',
      downloadUrl: 'https://www.xverse.app/',
      detectionKey: 'XverseProviders'
    },
    {
      id: 'leather',
      name: 'Leather',
      icon: '👛',
      description: 'Bitcoin-focused wallet with Stacks integration',
      downloadUrl: 'https://leather.io/',
      detectionKey: 'LeatherProvider'
    }
  ];

  useEffect(() => {
    detectWallets();
    loadConnectionHistory();
  }, []);

  useEffect(() => {
    if (account) {
      saveConnectionHistory();
    }
  }, [account]);

  const detectWallets = () => {
    const detected = [];

    supportedWallets.forEach(wallet => {
      if (window[wallet.detectionKey] || (wallet.id === 'hiro' && window.HiroWalletProvider)) {
        detected.push(wallet);
      }
    });

    setDetectedWallets(detected);
  };

  const loadConnectionHistory = () => {
    const history = localStorage.getItem('wallet-connection-history');
    if (history) {
      setConnectionHistory(JSON.parse(history));
    }
  };

  const saveConnectionHistory = () => {
    if (!account) return;

    const history = JSON.parse(localStorage.getItem('wallet-connection-history') || '[]');

    const newEntry = {
      address: account,
      timestamp: Date.now(),
      walletType: detectWalletType()
    };

    const updated = [
      newEntry,
      ...history.filter(h => h.address !== account)
    ].slice(0, 5);

    setConnectionHistory(updated);
    localStorage.setItem('wallet-connection-history', JSON.stringify(updated));
  };

  const detectWalletType = () => {
    if (window.StacksProvider || window.HiroWalletProvider) return 'Hiro Wallet';
    if (window.XverseProviders) return 'Xverse';
    if (window.LeatherProvider) return 'Leather';
    return 'Unknown';
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
      setIsOpen(false);
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect wallet. Please try again.');
    }
  };

  const handleDisconnect = () => {
    setShowDisconnectConfirm(true);
  };

  const confirmDisconnect = () => {
    disconnectWallet();
    setShowDisconnectConfirm(false);
    setIsOpen(false);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      alert('Address copied to clipboard!');
    }
  };

  const getConnectionStatus = () => {
    if (!account) return { label: 'Not Connected', color: '#95a5a6', icon: '⭕' };
    return { label: 'Connected', color: '#2ecc71', icon: '✅' };
  };

  const status = getConnectionStatus();

  return (
    <>
      <button
        className="wallet-manager-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Wallet Manager"
      >
        <span className="wallet-icon">👛</span>
        {account && <span className="connected-dot"></span>}
      </button>

      {isOpen && (
        <div className="wallet-manager-modal">
          <div className="wallet-backdrop" onClick={() => setIsOpen(false)} />
          <div className="wallet-content">
            <div className="wallet-header">
              <h2>👛 Wallet Manager</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="connection-status-card">
              <div className="status-indicator" style={{ background: status.color }}>
                {status.icon}
              </div>
              <div className="status-info">
                <div className="status-label">{status.label}</div>
                {account && (
                  <div className="status-details">
                    <span className="wallet-type">{detectWalletType()}</span>
                  </div>
                )}
              </div>
            </div>

            {account ? (
              <div className="connected-section">
                <div className="account-card">
                  <div className="account-header">
                    <h3>Active Account</h3>
                    <button className="copy-btn" onClick={copyAddress} title="Copy Address">
                      📋
                    </button>
                  </div>
                  <div className="account-address">
                    <code>{account}</code>
                  </div>
                  {userData?.profile && (
                    <div className="account-profile">
                      <strong>Username:</strong> {userData.profile.stxAddress?.testnet || 'N/A'}
                    </div>
                  )}
                </div>

                <div className="wallet-actions">
                  <button className="action-btn disconnect" onClick={handleDisconnect}>
                    🔌 Disconnect Wallet
                  </button>
                  <button className="action-btn refresh" onClick={detectWallets}>
                    🔄 Refresh Detection
                  </button>
                </div>

                {connectionHistory.length > 0 && (
                  <div className="connection-history">
                    <h3>📜 Recent Connections</h3>
                    <div className="history-list">
                      {connectionHistory.map((entry, index) => (
                        <div key={index} className="history-item">
                          <div className="history-icon">👤</div>
                          <div className="history-details">
                            <div className="history-address">
                              {truncateAddress(entry.address)}
                            </div>
                            <div className="history-meta">
                              <span className="history-wallet">{entry.walletType}</span>
                              <span className="history-time">{formatTimestamp(entry.timestamp)}</span>
                            </div>
                          </div>
                          {entry.address === account && (
                            <span className="current-badge">Current</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="not-connected-section">
                <div className="wallets-detected">
                  <h3>🔍 Detected Wallets ({detectedWallets.length})</h3>
                  {detectedWallets.length > 0 ? (
                    <div className="detected-list">
                      {detectedWallets.map(wallet => (
                        <div key={wallet.id} className="detected-wallet">
                          <span className="wallet-icon-large">{wallet.icon}</span>
                          <div className="wallet-info">
                            <div className="wallet-name">{wallet.name}</div>
                            <div className="wallet-status">✓ Installed</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-wallets">
                      <p>No Stacks wallets detected</p>
                    </div>
                  )}
                </div>

                <div className="connect-section">
                  <button
                    className="connect-btn"
                    onClick={handleConnect}
                    disabled={detectedWallets.length === 0}
                  >
                    {detectedWallets.length > 0 ? '🔗 Connect Wallet' : '⚠️ No Wallet Detected'}
                  </button>
                </div>

                <div className="supported-wallets">
                  <h3>💡 Supported Wallets</h3>
                  <div className="wallets-grid">
                    {supportedWallets.map(wallet => (
                      <a
                        key={wallet.id}
                        href={wallet.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="wallet-card"
                      >
                        <div className="card-icon">{wallet.icon}</div>
                        <div className="card-content">
                          <div className="card-name">{wallet.name}</div>
                          <div className="card-description">{wallet.description}</div>
                        </div>
                        <div className="card-arrow">→</div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="wallet-footer">
              <div className="footer-info">
                <span className="info-icon">ℹ️</span>
                <span>Using @stacks/connect with WalletConnect v2 integration</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDisconnectConfirm && (
        <div className="confirm-modal">
          <div className="confirm-backdrop" onClick={() => setShowDisconnectConfirm(false)} />
          <div className="confirm-content">
            <h3>⚠️ Disconnect Wallet?</h3>
            <p>Are you sure you want to disconnect your wallet?</p>
            <div className="confirm-actions">
              <button
                className="confirm-btn cancel"
                onClick={() => setShowDisconnectConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn disconnect"
                onClick={confirmDisconnect}
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletManager;
