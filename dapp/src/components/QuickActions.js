import React, { useState } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/QuickActions.css';

const QuickActions = () => {
  const { account } = useWalletConnect();
  const [isOpen, setIsOpen] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    recipient: '',
    amount: '',
    memo: ''
  });

  const quickActions = [
    {
      id: 'send-stx',
      icon: '💸',
      label: 'Send STX',
      description: 'Transfer STX tokens',
      color: '#3498db',
      action: () => {
        setShowTransferModal(true);
        setIsOpen(false);
      }
    },
    {
      id: 'view-balance',
      icon: '💰',
      label: 'View Balance',
      description: 'Check wallet balance',
      color: '#2ecc71',
      action: () => {
        alert('Navigate to Account Info section to view your balance');
        setIsOpen(false);
      }
    },
    {
      id: 'explorer',
      icon: '🔍',
      label: 'Explorer',
      description: 'View on blockchain explorer',
      color: '#9b59b6',
      action: () => {
        if (account) {
          window.open(`https://explorer.hiro.so/address/${account}?chain=testnet`, '_blank');
        }
        setIsOpen(false);
      }
    },
    {
      id: 'refresh-data',
      icon: '🔄',
      label: 'Refresh Data',
      description: 'Reload all blockchain data',
      color: '#e67e22',
      action: () => {
        window.location.reload();
      }
    },
    {
      id: 'copy-address',
      icon: '📋',
      label: 'Copy Address',
      description: 'Copy wallet address',
      color: '#1abc9c',
      action: () => {
        if (account) {
          navigator.clipboard.writeText(account);
          alert('Address copied to clipboard!');
        }
        setIsOpen(false);
      }
    },
    {
      id: 'qr-code',
      icon: '📱',
      label: 'QR Code',
      description: 'Generate QR code for address',
      color: '#f39c12',
      action: () => {
        if (account) {
          window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${account}`, '_blank');
        }
        setIsOpen(false);
      }
    },
    {
      id: 'faucet',
      icon: '💧',
      label: 'Testnet Faucet',
      description: 'Get testnet STX',
      color: '#3498db',
      action: () => {
        window.open('https://explorer.hiro.so/sandbox/faucet?chain=testnet', '_blank');
        setIsOpen(false);
      }
    },
    {
      id: 'docs',
      icon: '📚',
      label: 'Documentation',
      description: 'Read platform docs',
      color: '#95a5a6',
      action: () => {
        window.open('https://docs.stacks.co/', '_blank');
        setIsOpen(false);
      }
    },
    {
      id: 'support',
      icon: '💬',
      label: 'Support',
      description: 'Get help and support',
      color: '#e74c3c',
      action: () => {
        alert('For support, please visit our Discord or GitHub repository');
        setIsOpen(false);
      }
    }
  ];

  const recentActions = JSON.parse(localStorage.getItem('recent-actions') || '[]');

  const trackAction = (actionId) => {
    const recent = JSON.parse(localStorage.getItem('recent-actions') || '[]');
    const updated = [
      { id: actionId, timestamp: Date.now() },
      ...recent.filter(a => a.id !== actionId)
    ].slice(0, 3);
    localStorage.setItem('recent-actions', JSON.stringify(updated));
  };

  const handleAction = (action) => {
    trackAction(action.id);
    action.action();
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();

    if (!transferData.recipient || !transferData.amount) {
      alert('Please fill in recipient and amount');
      return;
    }

    const amountInMicroStx = Math.floor(parseFloat(transferData.amount) * 1000000);

    alert(`Transfer request:\nTo: ${transferData.recipient}\nAmount: ${transferData.amount} STX\nMemo: ${transferData.memo || 'None'}\n\nThis would integrate with openSTXTransfer in a production environment.`);

    setShowTransferModal(false);
    setTransferData({ recipient: '', amount: '', memo: '' });
  };

  const getRecentActionInfo = (actionId) => {
    return quickActions.find(a => a.id === actionId);
  };

  if (!account) {
    return null;
  }

  return (
    <>
      <button
        className="quick-actions-fab"
        onClick={() => setIsOpen(!isOpen)}
        title="Quick Actions"
      >
        ⚡
      </button>

      {isOpen && (
        <div className="quick-actions-menu">
          <div className="quick-actions-backdrop" onClick={() => setIsOpen(false)} />
          <div className="quick-actions-panel">
            <div className="quick-actions-header">
              <h3>⚡ Quick Actions</h3>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            {recentActions.length > 0 && (
              <div className="recent-actions-section">
                <h4>🕒 Recent</h4>
                <div className="recent-actions-grid">
                  {recentActions.map(recent => {
                    const actionInfo = getRecentActionInfo(recent.id);
                    if (!actionInfo) return null;
                    return (
                      <button
                        key={recent.id}
                        className="recent-action-btn"
                        onClick={() => handleAction(actionInfo)}
                        style={{ borderLeftColor: actionInfo.color }}
                      >
                        <span className="action-icon">{actionInfo.icon}</span>
                        <span className="action-label">{actionInfo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="quick-actions-grid">
              {quickActions.map(action => (
                <button
                  key={action.id}
                  className="quick-action-btn"
                  onClick={() => handleAction(action)}
                  style={{ background: `linear-gradient(135deg, ${action.color}, ${action.color}dd)` }}
                >
                  <div className="action-icon-large">{action.icon}</div>
                  <div className="action-content">
                    <div className="action-label">{action.label}</div>
                    <div className="action-description">{action.description}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="quick-actions-footer">
              <div className="footer-info">
                <span className="info-icon">ℹ️</span>
                <span>Click any action to execute instantly</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="transfer-modal">
          <div className="modal-backdrop" onClick={() => setShowTransferModal(false)} />
          <div className="modal-content">
            <div className="modal-header">
              <h3>💸 Send STX</h3>
              <button className="close-btn" onClick={() => setShowTransferModal(false)}>✕</button>
            </div>

            <form onSubmit={handleTransferSubmit} className="transfer-form">
              <div className="form-group">
                <label>Recipient Address</label>
                <input
                  type="text"
                  placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
                  value={transferData.recipient}
                  onChange={(e) => setTransferData({ ...transferData, recipient: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Amount (STX)</label>
                <input
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="10.50"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Memo (Optional)</label>
                <input
                  type="text"
                  placeholder="Payment for services"
                  value={transferData.memo}
                  onChange={(e) => setTransferData({ ...transferData, memo: e.target.value })}
                  maxLength={34}
                />
                <small>{transferData.memo.length}/34 characters</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowTransferModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Send STX
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickActions;
