import React, { useState, useEffect, useCallback } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/ActivityFeed.css';

const ActivityFeed = () => {
  const { account } = useWalletConnect();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const activityTypes = {
    stx_transfer_send: { icon: '📤', label: 'STX Sent', color: '#e74c3c' },
    stx_transfer_receive: { icon: '📥', label: 'STX Received', color: '#2ecc71' },
    contract_call: { icon: '📝', label: 'Contract Call', color: '#3498db' },
    nft_mint: { icon: '🎨', label: 'NFT Minted', color: '#9b59b6' },
    nft_transfer_send: { icon: '🖼️', label: 'NFT Sent', color: '#e67e22' },
    nft_transfer_receive: { icon: '🎁', label: 'NFT Received', color: '#1abc9c' },
    token_transfer_send: { icon: '💰', label: 'Token Sent', color: '#f39c12' },
    token_transfer_receive: { icon: '💵', label: 'Token Received', color: '#16a085' },
    smart_contract_deploy: { icon: '🚀', label: 'Contract Deployed', color: '#8e44ad' },
    coinbase: { icon: '⛏️', label: 'Mining Reward', color: '#d35400' }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
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
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return 'N/A';
    const value = parseInt(amount) / 1000000; // Convert microSTX to STX
    if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(2)}K`;
    return value.toFixed(2);
  };

  const truncateAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const determineActivityType = (tx) => {
    // Handle STX transfers
    if (tx.tx_type === 'token_transfer') {
      return tx.sender_address === account
        ? 'stx_transfer_send'
        : 'stx_transfer_receive';
    }

    // Handle contract calls
    if (tx.tx_type === 'contract_call') {
      return 'contract_call';
    }

    // Handle smart contract deployments
    if (tx.tx_type === 'smart_contract') {
      return 'smart_contract_deploy';
    }

    // Handle coinbase (mining rewards)
    if (tx.tx_type === 'coinbase') {
      return 'coinbase';
    }

    return 'contract_call';
  };

  const parseActivity = (tx) => {
    const type = determineActivityType(tx);
    const typeInfo = activityTypes[type] || activityTypes.contract_call;

    let description = '';
    let amount = null;
    let fromAddress = null;
    let toAddress = null;

    switch (type) {
      case 'stx_transfer_send':
        description = `Sent STX to ${truncateAddress(tx.token_transfer?.recipient_address)}`;
        amount = tx.token_transfer?.amount;
        fromAddress = tx.sender_address;
        toAddress = tx.token_transfer?.recipient_address;
        break;

      case 'stx_transfer_receive':
        description = `Received STX from ${truncateAddress(tx.sender_address)}`;
        amount = tx.token_transfer?.amount;
        fromAddress = tx.sender_address;
        toAddress = tx.token_transfer?.recipient_address;
        break;

      case 'contract_call':
        const contractName = tx.contract_call?.contract_id?.split('.')[1] || 'contract';
        const functionName = tx.contract_call?.function_name || 'function';
        description = `Called ${functionName} on ${contractName}`;
        fromAddress = tx.sender_address;
        break;

      case 'smart_contract_deploy':
        const deployedContract = tx.smart_contract?.contract_id?.split('.')[1] || 'contract';
        description = `Deployed ${deployedContract}`;
        fromAddress = tx.sender_address;
        break;

      case 'coinbase':
        description = 'Received mining reward';
        amount = tx.coinbase_payload?.amount;
        toAddress = account;
        break;

      default:
        description = `Transaction ${tx.tx_type}`;
        fromAddress = tx.sender_address;
    }

    return {
      id: tx.tx_id,
      type,
      icon: typeInfo.icon,
      label: typeInfo.label,
      color: typeInfo.color,
      description,
      amount,
      fromAddress,
      toAddress,
      timestamp: tx.burn_block_time,
      blockHeight: tx.block_height,
      txStatus: tx.tx_status,
      fee: tx.fee_rate
    };
  };

  const fetchActivities = useCallback(async () => {
    if (!account) {
      setActivities([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch transactions from Hiro API
      const response = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${account}/transactions?limit=50`
      );

      if (!response.ok) throw new Error('Failed to fetch activities');

      const data = await response.json();

      // Parse transactions into activities
      const parsedActivities = data.results
        .filter(tx => tx.tx_status === 'success' || tx.tx_status === 'pending')
        .map(tx => parseActivity(tx))
        .filter(activity => activity !== null);

      // Add some sample local activities from localStorage
      const localActivities = JSON.parse(localStorage.getItem('local-activities') || '[]');

      // Combine and sort by timestamp
      const combined = [...parsedActivities, ...localActivities]
        .sort((a, b) => b.timestamp - a.timestamp);

      setActivities(combined);
    } catch (error) {
      console.error('Error fetching activities:', error);

      // Load sample activities for demo
      const sampleActivities = generateSampleActivities();
      setActivities(sampleActivities);
    } finally {
      setLoading(false);
    }
  }, [account]);

  const generateSampleActivities = () => {
    const now = Math.floor(Date.now() / 1000);
    return [
      {
        id: 'sample-1',
        type: 'stx_transfer_receive',
        icon: '📥',
        label: 'STX Received',
        color: '#2ecc71',
        description: 'Received STX from ST2CY5V3...XX4CFR',
        amount: '500000000',
        fromAddress: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        toAddress: account,
        timestamp: now - 300,
        blockHeight: 12345,
        txStatus: 'success',
        fee: '1000'
      },
      {
        id: 'sample-2',
        type: 'contract_call',
        icon: '📝',
        label: 'Contract Call',
        color: '#3498db',
        description: 'Called transfer on token-contract',
        fromAddress: account,
        timestamp: now - 3600,
        blockHeight: 12340,
        txStatus: 'success',
        fee: '2000'
      },
      {
        id: 'sample-3',
        type: 'nft_transfer_receive',
        icon: '🎁',
        label: 'NFT Received',
        color: '#1abc9c',
        description: 'Received NFT from ST1PQHQ...WBQE0R',
        fromAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        toAddress: account,
        timestamp: now - 7200,
        blockHeight: 12330,
        txStatus: 'success',
        fee: '1500'
      },
      {
        id: 'sample-4',
        type: 'stx_transfer_send',
        icon: '📤',
        label: 'STX Sent',
        color: '#e74c3c',
        description: 'Sent STX to ST3NBRSFK...D94GT4',
        amount: '1000000000',
        fromAddress: account,
        toAddress: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP',
        timestamp: now - 14400,
        blockHeight: 12320,
        txStatus: 'success',
        fee: '1000'
      },
      {
        id: 'sample-5',
        type: 'smart_contract_deploy',
        icon: '🚀',
        label: 'Contract Deployed',
        color: '#8e44ad',
        description: 'Deployed my-awesome-contract',
        fromAddress: account,
        timestamp: now - 28800,
        blockHeight: 12300,
        txStatus: 'success',
        fee: '5000'
      }
    ];
  };

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (!autoRefresh || !account) return;

    const interval = setInterval(() => {
      fetchActivities();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, account, fetchActivities]);

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'sent') return activity.type.includes('send');
    if (filter === 'received') return activity.type.includes('receive');
    if (filter === 'contracts') return activity.type.includes('contract') || activity.type.includes('deploy');
    if (filter === 'nfts') return activity.type.includes('nft');
    return true;
  });

  const stats = {
    total: activities.length,
    sent: activities.filter(a => a.type.includes('send')).length,
    received: activities.filter(a => a.type.includes('receive')).length,
    contracts: activities.filter(a => a.type.includes('contract') || a.type.includes('deploy')).length
  };

  if (!account) {
    return (
      <div className="activity-feed">
        <div className="activity-empty">
          <div className="empty-icon">🔒</div>
          <h3>Connect Your Wallet</h3>
          <p>Connect your wallet to view your activity feed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="activity-header">
        <div className="header-title">
          <h2>📊 Activity Feed</h2>
          <p>Real-time blockchain activities and transactions</p>
        </div>
        <div className="header-actions">
          <label className="auto-refresh-toggle">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span className="toggle-label">Auto-refresh</span>
          </label>
          <button
            className="refresh-button"
            onClick={fetchActivities}
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      <div className="activity-stats">
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Activities</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📤</div>
          <div className="stat-info">
            <div className="stat-value">{stats.sent}</div>
            <div className="stat-label">Sent</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.received}</div>
            <div className="stat-label">Received</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-value">{stats.contracts}</div>
            <div className="stat-label">Contracts</div>
          </div>
        </div>
      </div>

      <div className="activity-filters">
        <button
          className={`filter-button ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({activities.length})
        </button>
        <button
          className={`filter-button ${filter === 'sent' ? 'active' : ''}`}
          onClick={() => setFilter('sent')}
        >
          📤 Sent ({stats.sent})
        </button>
        <button
          className={`filter-button ${filter === 'received' ? 'active' : ''}`}
          onClick={() => setFilter('received')}
        >
          📥 Received ({stats.received})
        </button>
        <button
          className={`filter-button ${filter === 'contracts' ? 'active' : ''}`}
          onClick={() => setFilter('contracts')}
        >
          📝 Contracts ({stats.contracts})
        </button>
        <button
          className={`filter-button ${filter === 'nfts' ? 'active' : ''}`}
          onClick={() => setFilter('nfts')}
        >
          🎨 NFTs
        </button>
      </div>

      <div className="activity-list">
        {loading && activities.length === 0 ? (
          <div className="activity-loading">
            <div className="loading-spinner"></div>
            <p>Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="activity-empty">
            <div className="empty-icon">📭</div>
            <h3>No Activities Found</h3>
            <p>
              {filter === 'all'
                ? 'No activities to display yet'
                : `No ${filter} activities found`}
            </p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div
                className="activity-icon"
                style={{ background: `linear-gradient(135deg, ${activity.color}, ${activity.color}dd)` }}
              >
                {activity.icon}
              </div>
              <div className="activity-content">
                <div className="activity-main">
                  <div className="activity-title">
                    <span className="activity-label">{activity.label}</span>
                    <span
                      className={`activity-status ${activity.txStatus}`}
                    >
                      {activity.txStatus === 'success' ? '✓' : '⏳'}
                    </span>
                  </div>
                  <div className="activity-description">{activity.description}</div>
                  <div className="activity-meta">
                    <span className="meta-item">
                      <span className="meta-label">Block:</span> {activity.blockHeight}
                    </span>
                    <span className="meta-item">
                      <span className="meta-label">Fee:</span> {activity.fee ? `${parseInt(activity.fee) / 1000000} STX` : 'N/A'}
                    </span>
                    <span className="meta-item">
                      <span className="meta-label">Time:</span> {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
                {activity.amount && (
                  <div className="activity-amount">
                    <div className="amount-value">{formatAmount(activity.amount)}</div>
                    <div className="amount-label">STX</div>
                  </div>
                )}
              </div>
              <a
                href={`https://explorer.hiro.so/txid/${activity.id}?chain=testnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="activity-link"
                title="View on Explorer"
              >
                🔗
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
