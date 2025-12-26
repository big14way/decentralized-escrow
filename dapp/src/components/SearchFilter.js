import React, { useState, useEffect } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/SearchFilter.css';

const SearchFilter = () => {
  const { account } = useWalletConnect();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'all',
    status: 'all',
    amountMin: '',
    amountMax: '',
    sortBy: 'date-desc'
  });
  const [recentSearches, setRecentSearches] = useState([]);

  const searchTypes = [
    { id: 'all', label: 'All', icon: '🔍' },
    { id: 'transactions', label: 'Transactions', icon: '💰' },
    { id: 'contracts', label: 'Contracts', icon: '📝' },
    { id: 'addresses', label: 'Addresses', icon: '👤' },
    { id: 'blocks', label: 'Blocks', icon: '⛓️' },
    { id: 'nfts', label: 'NFTs', icon: '🎨' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (query, type) => {
    if (!query.trim()) return;

    const search = {
      query,
      type,
      timestamp: Date.now()
    };

    const updated = [
      search,
      ...recentSearches.filter(s => s.query !== query || s.type !== type)
    ].slice(0, 5);

    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent-searches');
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    saveRecentSearch(searchQuery, searchType);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockResults = generateMockResults(searchQuery, searchType);
      const filtered = applyFilters(mockResults);
      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const generateMockResults = (query, type) => {
    const now = Date.now();
    const results = [];

    if (type === 'all' || type === 'transactions') {
      results.push({
        id: 'tx-1',
        type: 'transaction',
        title: 'STX Transfer',
        subtitle: 'Transfer of 500 STX',
        details: `From: ${account?.substring(0, 10)}... To: ST2CY5V39...`,
        amount: '500 STX',
        status: 'success',
        timestamp: now - 300000,
        blockHeight: 12345
      });

      results.push({
        id: 'tx-2',
        type: 'transaction',
        title: 'Contract Call',
        subtitle: 'token-transfer function',
        details: 'Contract: my-token.clar',
        amount: '100 STX',
        status: 'pending',
        timestamp: now - 600000,
        blockHeight: 12344
      });
    }

    if (type === 'all' || type === 'contracts') {
      results.push({
        id: 'contract-1',
        type: 'contract',
        title: 'my-awesome-contract',
        subtitle: 'Smart contract deployment',
        details: `Deployed by: ${account?.substring(0, 15)}...`,
        status: 'success',
        timestamp: now - 3600000,
        blockHeight: 12300
      });

      results.push({
        id: 'contract-2',
        type: 'contract',
        title: 'nft-marketplace',
        subtitle: 'NFT marketplace contract',
        details: 'Deployed by: ST1PQHQKV0R...',
        status: 'success',
        timestamp: now - 7200000,
        blockHeight: 12250
      });
    }

    if (type === 'all' || type === 'nfts') {
      results.push({
        id: 'nft-1',
        type: 'nft',
        title: 'Cosmic Warriors #247',
        subtitle: 'NFT Collection',
        details: 'Owned by: You',
        status: 'success',
        timestamp: now - 86400000,
        blockHeight: 12100
      });
    }

    if (type === 'all' || type === 'blocks') {
      results.push({
        id: 'block-1',
        type: 'block',
        title: 'Block #12345',
        subtitle: '25 transactions',
        details: 'Hash: 0x7a8f9b2c...',
        timestamp: now - 600000,
        blockHeight: 12345
      });
    }

    if (type === 'all' || type === 'addresses') {
      results.push({
        id: 'addr-1',
        type: 'address',
        title: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
        subtitle: 'Wallet Address',
        details: 'Balance: 1,250 STX',
        status: 'active',
        timestamp: now
      });
    }

    return results;
  };

  const applyFilters = (data) => {
    let filtered = [...data];

    if (filters.dateRange !== 'all') {
      const now = Date.now();
      let cutoff = 0;
      if (filters.dateRange === '1h') cutoff = now - 3600000;
      else if (filters.dateRange === '24h') cutoff = now - 86400000;
      else if (filters.dateRange === '7d') cutoff = now - 604800000;
      else if (filters.dateRange === '30d') cutoff = now - 2592000000;

      filtered = filtered.filter(item => item.timestamp >= cutoff);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.sortBy === 'date-desc') {
      filtered.sort((a, b) => b.timestamp - a.timestamp);
    } else if (filters.sortBy === 'date-asc') {
      filtered.sort((a, b) => a.timestamp - b.timestamp);
    } else if (filters.sortBy === 'block-desc') {
      filtered.sort((a, b) => (b.blockHeight || 0) - (a.blockHeight || 0));
    } else if (filters.sortBy === 'block-asc') {
      filtered.sort((a, b) => (a.blockHeight || 0) - (b.blockHeight || 0));
    }

    return filtered;
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
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getTypeIcon = (type) => {
    const typeObj = searchTypes.find(t => t.id === type);
    return typeObj ? typeObj.icon : '📄';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      dateRange: 'all',
      status: 'all',
      amountMin: '',
      amountMax: '',
      sortBy: 'date-desc'
    });
  };

  if (!account) {
    return null;
  }

  return (
    <>
      <button
        className="search-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Search & Filter"
      >
        🔍
      </button>

      {isOpen && (
        <div className="search-filter-panel">
          <div className="search-backdrop" onClick={() => setIsOpen(false)} />
          <div className="search-content">
            <div className="search-header">
              <h2>🔍 Search & Filter</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="search-input-section">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search transactions, contracts, addresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button
                  className="search-btn"
                  onClick={performSearch}
                  disabled={loading || !searchQuery.trim()}
                >
                  {loading ? '🔄' : '🔍'} Search
                </button>
              </div>

              <div className="search-types">
                {searchTypes.map(type => (
                  <button
                    key={type.id}
                    className={`type-btn ${searchType === type.id ? 'active' : ''}`}
                    onClick={() => setSearchType(type.id)}
                  >
                    {type.icon} {type.label}
                  </button>
                ))}
              </div>
            </div>

            {recentSearches.length > 0 && !searchQuery && (
              <div className="recent-searches-section">
                <div className="section-header">
                  <h3>🕒 Recent Searches</h3>
                  <button className="clear-btn" onClick={clearRecentSearches}>
                    Clear all
                  </button>
                </div>
                <div className="recent-searches-list">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      className="recent-search-item"
                      onClick={() => {
                        setSearchQuery(search.query);
                        setSearchType(search.type);
                      }}
                    >
                      <span className="search-icon">🔍</span>
                      <span className="search-text">{search.query}</span>
                      <span className="search-type-badge">
                        {searchTypes.find(t => t.id === search.type)?.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="filters-section">
              <h3>⚙️ Filters</h3>
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => updateFilter('dateRange', e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilter('status', e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilter('sortBy', e.target.value)}
                  >
                    <option value="date-desc">Date (Newest)</option>
                    <option value="date-asc">Date (Oldest)</option>
                    <option value="block-desc">Block (Highest)</option>
                    <option value="block-asc">Block (Lowest)</option>
                  </select>
                </div>

                <div className="filter-group">
                  <button className="reset-filters-btn" onClick={resetFilters}>
                    Reset Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="results-section">
              <div className="results-header">
                <h3>Results {results.length > 0 && `(${results.length})`}</h3>
              </div>

              {loading ? (
                <div className="search-loading">
                  <div className="loading-spinner"></div>
                  <p>Searching...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="results-list">
                  {results.map(result => (
                    <div key={result.id} className="result-item">
                      <div className="result-icon">{getTypeIcon(result.type)}</div>
                      <div className="result-content">
                        <div className="result-title">{result.title}</div>
                        <div className="result-subtitle">{result.subtitle}</div>
                        <div className="result-details">{result.details}</div>
                        <div className="result-meta">
                          {result.blockHeight && (
                            <span className="meta-item">Block: {result.blockHeight}</span>
                          )}
                          <span className="meta-item">{formatTimestamp(result.timestamp)}</span>
                        </div>
                      </div>
                      {result.amount && (
                        <div className="result-amount">{result.amount}</div>
                      )}
                      {result.status && (
                        <span className={`result-status ${result.status}`}>
                          {result.status}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="search-empty">
                  <div className="empty-icon">🔍</div>
                  <h3>No Results Found</h3>
                  <p>Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="search-empty">
                  <div className="empty-icon">🔎</div>
                  <h3>Start Searching</h3>
                  <p>Enter a search query to find transactions, contracts, and more</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SearchFilter;
