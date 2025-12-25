import React, { useState, useEffect } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/AccountInfo.css';

const AccountInfo = () => {
  const { account, isConnected } = useWalletConnect();
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isConnected && account) {
      fetchAccountData();
    } else {
      setBalance(null);
      setTransactions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, account]);

  const fetchAccountData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch STX balance
      const balanceResponse = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${account}/balances`
      );
      const balanceData = await balanceResponse.json();
      setBalance(balanceData.stx.balance);

      // Fetch recent transactions
      const txResponse = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${account}/transactions?limit=10`
      );
      const txData = await txResponse.json();
      setTransactions(txData.results || []);
    } catch (err) {
      console.error('Failed to fetch account data:', err);
      setError('Failed to load account information');
    } finally {
      setLoading(false);
    }
  };

  const formatSTX = (microStx) => {
    return (Number(microStx) / 1000000).toFixed(6);
  };

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getTransactionType = (tx) => {
    if (tx.tx_type === 'contract_call') return 'Contract Call';
    if (tx.tx_type === 'token_transfer') return 'STX Transfer';
    if (tx.tx_type === 'smart_contract') return 'Contract Deploy';
    return tx.tx_type;
  };

  const getTransactionStatus = (tx) => {
    if (tx.tx_status === 'success') return '✅';
    if (tx.tx_status === 'pending') return '⏳';
    return '❌';
  };

  if (!isConnected) {
    return (
      <div className="account-info">
        <p className="not-connected">Connect your wallet to view account information</p>
      </div>
    );
  }

  return (
    <div className="account-info">
      <h2>Account Information</h2>

      {loading && <p className="loading">Loading account data...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="balance-section">
            <h3>STX Balance</h3>
            <div className="balance-display">
              {balance !== null ? (
                <>
                  <span className="balance-amount">{formatSTX(balance)}</span>
                  <span className="balance-unit">STX</span>
                </>
              ) : (
                <span className="balance-loading">Loading...</span>
              )}
            </div>
            <button onClick={fetchAccountData} className="refresh-btn">
              🔄 Refresh
            </button>
          </div>

          <div className="transactions-section">
            <h3>Recent Transactions</h3>
            {transactions.length > 0 ? (
              <div className="transactions-list">
                {transactions.map((tx, index) => (
                  <div key={tx.tx_id || index} className="transaction-item">
                    <div className="tx-header">
                      <span className="tx-status">{getTransactionStatus(tx)}</span>
                      <span className="tx-type">{getTransactionType(tx)}</span>
                      <span className="tx-time">
                        {new Date(tx.burn_block_time * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="tx-details">
                      <span className="tx-id">{formatAddress(tx.tx_id)}</span>
                      {tx.tx_type === 'token_transfer' && tx.token_transfer && (
                        <span className="tx-amount">
                          {formatSTX(tx.token_transfer.amount)} STX
                        </span>
                      )}
                    </div>
                    <a
                      href={`https://explorer.hiro.so/txid/${tx.tx_id}?chain=testnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tx-link"
                    >
                      View Details →
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-transactions">No transactions found</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AccountInfo;
