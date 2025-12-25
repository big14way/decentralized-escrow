import React, { useState, useEffect } from 'react';
import '../styles/TransactionHistory.css';

const TransactionHistory = () => {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const stored = localStorage.getItem('txHistory');
    if (stored) {
      setHistory(JSON.parse(stored));
    }
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all transaction history?')) {
      localStorage.removeItem('txHistory');
      setHistory([]);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatArgs = (args) => {
    if (!args || args.length === 0) return 'No arguments';
    return args.map((arg, i) => `${i + 1}. ${arg.type}: ${arg.value}`).join(', ');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const filteredHistory = filter === 'all'
    ? history
    : history.filter(tx => tx.functionName.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="transaction-history">
      <div className="history-header">
        <h2>Transaction History</h2>
        <div className="history-controls">
          <input
            type="text"
            placeholder="Filter by function..."
            value={filter === 'all' ? '' : filter}
            onChange={(e) => setFilter(e.target.value || 'all')}
            className="filter-input"
          />
          <button onClick={clearHistory} className="clear-btn">
            Clear History
          </button>
        </div>
      </div>

      {filteredHistory.length > 0 ? (
        <div className="history-list">
          {filteredHistory.map((tx, index) => (
            <div key={index} className="history-item">
              <div className="history-item-header">
                <span className="function-badge">{tx.functionName}</span>
                <span className="timestamp">{formatTimestamp(tx.timestamp)}</span>
              </div>

              <div className="history-item-body">
                <div className="tx-id-row">
                  <span className="label">Transaction ID:</span>
                  <span className="tx-id-value">{tx.txId}</span>
                  <button
                    onClick={() => copyToClipboard(tx.txId)}
                    className="copy-btn"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>

                <div className="args-row">
                  <span className="label">Arguments:</span>
                  <span className="args-value">{formatArgs(tx.args)}</span>
                </div>
              </div>

              <div className="history-item-footer">
                <a
                  href={`https://explorer.hiro.so/txid/${tx.txId}?chain=testnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="explorer-link"
                >
                  View on Explorer →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>📝 No transactions in history</p>
          <p className="empty-hint">
            Transactions you build will appear here
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
