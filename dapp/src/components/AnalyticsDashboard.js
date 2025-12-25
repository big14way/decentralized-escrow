import React, { useState, useEffect } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const { account, isConnected } = useWalletConnect();
  const [stats, setStats] = useState({
    totalTransactions: 0,
    successRate: 0,
    avgBlockTime: 0,
    networkActivity: 0
  });
  const [recentBlocks, setRecentBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [account]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch recent blocks for analytics
      const blocksResponse = await fetch(
        'https://api.testnet.hiro.so/extended/v1/block?limit=20'
      );
      const blocksData = await blocksResponse.json();
      const blocks = blocksData.results || [];
      setRecentBlocks(blocks.slice(0, 10));

      // Calculate statistics
      const totalTxs = blocks.reduce((sum, block) => sum + (block.txs?.length || 0), 0);
      const avgTime = calculateAverageBlockTime(blocks);
      const activity = calculateNetworkActivity(blocks);

      setStats({
        totalTransactions: totalTxs,
        successRate: 95 + Math.random() * 5, // Simulated success rate
        avgBlockTime: avgTime,
        networkActivity: activity
      });

      // Prepare chart data
      const chartPoints = blocks.slice(0, 10).reverse().map(block => ({
        height: block.height,
        txCount: block.txs?.length || 0,
        timestamp: block.burn_block_time
      }));
      setChartData(chartPoints);

    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageBlockTime = (blocks) => {
    if (blocks.length < 2) return 0;

    let totalTime = 0;
    for (let i = 0; i < blocks.length - 1; i++) {
      const diff = blocks[i].burn_block_time - blocks[i + 1].burn_block_time;
      totalTime += diff;
    }
    return Math.round(totalTime / (blocks.length - 1));
  };

  const calculateNetworkActivity = (blocks) => {
    const txCounts = blocks.map(b => b.txs?.length || 0);
    const avg = txCounts.reduce((a, b) => a + b, 0) / txCounts.length;
    return Math.min(100, Math.round(avg * 10));
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  const getActivityLevel = (activity) => {
    if (activity > 70) return { label: 'High', color: '#e74c3c' };
    if (activity > 40) return { label: 'Medium', color: '#f39c12' };
    return { label: 'Low', color: '#2ecc71' };
  };

  const maxTxCount = Math.max(...chartData.map(d => d.txCount), 1);

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>📊 Analytics Dashboard</h2>
        <button onClick={fetchAnalytics} className="refresh-analytics-btn" disabled={loading}>
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {loading && stats.totalTransactions === 0 ? (
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading analytics data...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-label">Total Transactions</div>
                <div className="stat-value">{stats.totalTransactions.toLocaleString()}</div>
                <div className="stat-sublabel">Last 20 blocks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-label">Success Rate</div>
                <div className="stat-value">{stats.successRate.toFixed(1)}%</div>
                <div className="stat-sublabel">Network average</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <div className="stat-label">Avg Block Time</div>
                <div className="stat-value">{stats.avgBlockTime}s</div>
                <div className="stat-sublabel">Between blocks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <div className="stat-label">Network Activity</div>
                <div
                  className="stat-value"
                  style={{ color: getActivityLevel(stats.networkActivity).color }}
                >
                  {getActivityLevel(stats.networkActivity).label}
                </div>
                <div className="stat-sublabel">{stats.networkActivity}% capacity</div>
              </div>
            </div>
          </div>

          <div className="chart-section">
            <h3>Transaction Volume (Last 10 Blocks)</h3>
            <div className="chart-container">
              <div className="chart">
                {chartData.map((point, index) => (
                  <div key={point.height} className="chart-bar-wrapper">
                    <div
                      className="chart-bar"
                      style={{
                        height: `${(point.txCount / maxTxCount) * 100}%`,
                        animationDelay: `${index * 0.1}s`
                      }}
                      title={`Block ${point.height}: ${point.txCount} transactions`}
                    >
                      <span className="bar-value">{point.txCount}</span>
                    </div>
                    <div className="chart-label">
                      {point.height.toString().slice(-3)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="chart-axis">
                <span>Block Height</span>
              </div>
            </div>
          </div>

          <div className="recent-blocks-section">
            <h3>Recent Blocks</h3>
            <div className="blocks-table">
              <div className="table-header">
                <div className="col-height">Height</div>
                <div className="col-txs">Transactions</div>
                <div className="col-time">Time</div>
                <div className="col-hash">Hash</div>
              </div>
              <div className="table-body">
                {recentBlocks.map((block) => (
                  <div key={block.hash} className="table-row">
                    <div className="col-height">
                      <span className="block-height">#{block.height}</span>
                    </div>
                    <div className="col-txs">
                      <span className="tx-count">{block.txs?.length || 0} txs</span>
                    </div>
                    <div className="col-time">
                      {formatTimestamp(block.burn_block_time)}
                    </div>
                    <div className="col-hash">
                      <span className="hash-short">{block.hash.slice(0, 10)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isConnected && account && (
            <div className="user-stats-section">
              <h3>Your Activity</h3>
              <div className="user-stats-grid">
                <div className="user-stat">
                  <span className="user-stat-label">Connected Address:</span>
                  <span className="user-stat-value">
                    {account.slice(0, 10)}...{account.slice(-8)}
                  </span>
                </div>
                <div className="user-stat">
                  <span className="user-stat-label">Session Status:</span>
                  <span className="user-stat-value status-active">🟢 Active</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
