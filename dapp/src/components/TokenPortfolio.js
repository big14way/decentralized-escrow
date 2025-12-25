import React, { useState, useEffect } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/TokenPortfolio.css';

const TokenPortfolio = () => {
  const { account, isConnected } = useWalletConnect();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [selectedToken, setSelectedToken] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);

  useEffect(() => {
    if (isConnected && account) {
      fetchTokenBalances();
    } else {
      setTokens([]);
      setTotalValue(0);
    }
  }, [isConnected, account]);

  const fetchTokenBalances = async () => {
    setLoading(true);
    try {
      // Fetch FT events (Fungible Tokens)
      const response = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${account}/assets`
      );
      const data = await response.json();

      // Parse fungible tokens
      const ftBalances = [];

      if (data.fungible_tokens) {
        Object.entries(data.fungible_tokens).forEach(([assetId, balance]) => {
          const [contractId, tokenName] = assetId.split('::');
          ftBalances.push({
            assetId,
            contractId,
            tokenName,
            balance: balance.balance,
            totalSent: balance.total_sent,
            totalReceived: balance.total_received,
            // Simulated price data
            price: Math.random() * 10,
            change24h: (Math.random() - 0.5) * 20
          });
        });
      }

      // Always include STX
      const stxBalance = await fetchSTXBalance();
      const stxToken = {
        assetId: 'STX',
        contractId: 'Native',
        tokenName: 'STX',
        balance: stxBalance,
        totalSent: '0',
        totalReceived: stxBalance,
        price: 0.75, // Simulated STX price
        change24h: (Math.random() - 0.5) * 10
      };

      const allTokens = [stxToken, ...ftBalances];
      setTokens(allTokens);

      // Calculate total portfolio value
      const total = allTokens.reduce((sum, token) => {
        const balance = parseFloat(token.balance) / 1000000;
        return sum + (balance * token.price);
      }, 0);
      setTotalValue(total);

    } catch (err) {
      console.error('Failed to fetch token balances:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSTXBalance = async () => {
    try {
      const response = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${account}/balances`
      );
      const data = await response.json();
      return data.stx.balance || '0';
    } catch (err) {
      return '0';
    }
  };

  const viewTokenDetails = (token) => {
    setSelectedToken(token);
    generatePriceHistory(token);
  };

  const generatePriceHistory = (token) => {
    // Generate simulated 30-day price history
    const history = [];
    let basePrice = token.price;

    for (let i = 30; i >= 0; i--) {
      const variance = (Math.random() - 0.5) * 0.2;
      const price = basePrice * (1 + variance);
      history.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        price: Math.max(0.01, price)
      });
      basePrice = price;
    }

    setPriceHistory(history);
  };

  const formatBalance = (balance) => {
    const value = parseFloat(balance) / 1000000;
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    });
  };

  const formatCurrency = (value) => {
    return value.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatAddress = (address) => {
    if (address === 'Native') return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const getPriceChangeColor = (change) => {
    return change >= 0 ? '#2ecc71' : '#e74c3c';
  };

  const maxPrice = Math.max(...priceHistory.map(h => h.price), 1);
  const minPrice = Math.min(...priceHistory.map(h => h.price), 0);

  return (
    <div className="token-portfolio">
      <div className="portfolio-header">
        <div className="header-left">
          <h2>💰 Token Portfolio</h2>
          {isConnected && (
            <div className="total-value">
              <span className="value-label">Total Value</span>
              <span className="value-amount">{formatCurrency(totalValue)}</span>
            </div>
          )}
        </div>
        <div className="header-right">
          {isConnected && (
            <button onClick={fetchTokenBalances} className="refresh-portfolio-btn" disabled={loading}>
              {loading ? '🔄 Loading...' : '🔄 Refresh'}
            </button>
          )}
        </div>
      </div>

      {!isConnected ? (
        <div className="empty-state">
          <div className="empty-icon">🔐</div>
          <h3>Connect Your Wallet</h3>
          <p>Connect your wallet to view your token portfolio</p>
        </div>
      ) : loading && tokens.length === 0 ? (
        <div className="loading-state">
          <div className="portfolio-loader"></div>
          <p>Loading your token portfolio...</p>
        </div>
      ) : tokens.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🪙</div>
          <h3>No Tokens Found</h3>
          <p>Your wallet doesn't contain any tokens yet</p>
        </div>
      ) : (
        <div className="tokens-container">
          <div className="tokens-grid">
            {tokens.map((token) => {
              const balance = parseFloat(token.balance) / 1000000;
              const value = balance * token.price;

              return (
                <div
                  key={token.assetId}
                  className="token-card"
                  onClick={() => viewTokenDetails(token)}
                >
                  <div className="token-card-header">
                    <div className="token-icon">
                      {token.tokenName === 'STX' ? '₿' : '🪙'}
                    </div>
                    <div className="token-info">
                      <h4 className="token-name">{token.tokenName}</h4>
                      <p className="token-contract">{formatAddress(token.contractId)}</p>
                    </div>
                  </div>

                  <div className="token-card-body">
                    <div className="balance-row">
                      <span className="balance-label">Balance</span>
                      <span className="balance-value">{formatBalance(token.balance)}</span>
                    </div>

                    <div className="value-row">
                      <span className="value-label">Value</span>
                      <span className="value-amount">{formatCurrency(value)}</span>
                    </div>

                    <div className="price-row">
                      <span className="price-label">Price</span>
                      <div className="price-info">
                        <span className="price-value">{formatCurrency(token.price)}</span>
                        <span
                          className="price-change"
                          style={{ color: getPriceChangeColor(token.change24h) }}
                        >
                          {token.change24h >= 0 ? '▲' : '▼'} {Math.abs(token.change24h).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedToken && (
        <div className="token-modal" onClick={() => setSelectedToken(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedToken(null)}>×</button>

            <div className="modal-header">
              <div className="modal-token-icon">
                {selectedToken.tokenName === 'STX' ? '₿' : '🪙'}
              </div>
              <div>
                <h2>{selectedToken.tokenName}</h2>
                <p className="modal-contract">{selectedToken.contractId}</p>
              </div>
            </div>

            <div className="modal-stats">
              <div className="stat-item">
                <span className="stat-label">Balance</span>
                <span className="stat-value">{formatBalance(selectedToken.balance)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Value</span>
                <span className="stat-value">
                  {formatCurrency((parseFloat(selectedToken.balance) / 1000000) * selectedToken.price)}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Price</span>
                <span className="stat-value">{formatCurrency(selectedToken.price)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">24h Change</span>
                <span
                  className="stat-value"
                  style={{ color: getPriceChangeColor(selectedToken.change24h) }}
                >
                  {selectedToken.change24h >= 0 ? '+' : ''}{selectedToken.change24h.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="price-chart-section">
              <h3>30-Day Price History</h3>
              <div className="price-chart">
                <div className="chart-area">
                  {priceHistory.map((point, index) => {
                    const height = ((point.price - minPrice) / (maxPrice - minPrice)) * 100;
                    const isLast = index === priceHistory.length - 1;

                    return (
                      <div
                        key={index}
                        className="chart-point"
                        style={{
                          height: `${height}%`,
                          background: isLast ? '#667eea' : 'rgba(102, 126, 234, 0.3)'
                        }}
                        title={`${point.date.toLocaleDateString()}: ${formatCurrency(point.price)}`}
                      />
                    );
                  })}
                </div>
                <div className="chart-labels">
                  <span>30 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            </div>

            <div className="transaction-stats">
              <div className="stat-row">
                <span className="label">Total Received</span>
                <span className="value">{formatBalance(selectedToken.totalReceived)}</span>
              </div>
              <div className="stat-row">
                <span className="label">Total Sent</span>
                <span className="value">{formatBalance(selectedToken.totalSent)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenPortfolio;
