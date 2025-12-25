import React, { useState, useEffect } from 'react';
import '../styles/NetworkStatus.css';

const NetworkStatus = () => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [blockInfo, setBlockInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetworkInfo();
    fetchBlockInfo();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchBlockInfo();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNetworkInfo = async () => {
    try {
      const response = await fetch('https://api.testnet.hiro.so/v2/info');
      const data = await response.json();
      setNetworkInfo(data);
    } catch (err) {
      console.error('Failed to fetch network info:', err);
    }
  };

  const fetchBlockInfo = async () => {
    try {
      const response = await fetch('https://api.testnet.hiro.so/extended/v1/block');
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setBlockInfo(data.results[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch block info:', err);
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="network-status loading">
        <span className="status-indicator">🔄</span>
        <span>Loading network status...</span>
      </div>
    );
  }

  return (
    <div className="network-status">
      <div className="status-header">
        <span className="status-indicator online">●</span>
        <span className="network-name">Stacks Testnet</span>
      </div>

      <div className="status-details">
        {networkInfo && (
          <div className="status-item">
            <span className="status-label">Network:</span>
            <span className="status-value">{networkInfo.network_id}</span>
          </div>
        )}

        {blockInfo && (
          <>
            <div className="status-item">
              <span className="status-label">Block Height:</span>
              <span className="status-value">{blockInfo.height}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Block Time:</span>
              <span className="status-value">
                {formatTimestamp(blockInfo.burn_block_time)}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Transactions:</span>
              <span className="status-value">{blockInfo.txs?.length || 0}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;
