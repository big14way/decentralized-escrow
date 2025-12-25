import React, { useState, useEffect } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/NFTGallery.css';

const NFTGallery = () => {
  const { account, isConnected } = useWalletConnect();
  const [nftHoldings, setNftHoldings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isConnected && account) {
      fetchNFTs();
    } else {
      setNftHoldings([]);
    }
  }, [isConnected, account]);

  const fetchNFTs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.testnet.hiro.so/extended/v1/address/${account}/nft_events?limit=50`
      );
      const data = await response.json();

      // Group NFTs by asset identifier
      const nftMap = new Map();

      if (data.nft_events) {
        data.nft_events.forEach(event => {
          if (event.asset_event_type === 'mint' || event.asset_event_type === 'transfer') {
            const key = event.asset_identifier;
            if (!nftMap.has(key)) {
              nftMap.set(key, {
                assetId: event.asset_identifier,
                contractId: event.asset_identifier.split('::')[0],
                assetName: event.asset_identifier.split('::')[1],
                value: event.value?.repr || 'Unknown',
                txId: event.tx_id,
                blockHeight: event.block_height,
                eventType: event.asset_event_type,
                count: 1
              });
            } else {
              nftMap.get(key).count++;
            }
          }
        });
      }

      setNftHoldings(Array.from(nftMap.values()));
    } catch (err) {
      console.error('Failed to fetch NFTs:', err);
    } finally {
      setLoading(false);
    }
  };

  const openNFTDetails = (nft) => {
    setSelectedNFT(nft);
  };

  const closeNFTDetails = () => {
    setSelectedNFT(null);
  };

  const getFilteredNFTs = () => {
    if (filter === 'all') return nftHoldings;
    return nftHoldings.filter(nft =>
      nft.assetName.toLowerCase().includes(filter.toLowerCase())
    );
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const generatePlaceholderImage = (assetId) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];
    const index = assetId.length % colors.length;
    return colors[index];
  };

  const filteredNFTs = getFilteredNFTs();

  return (
    <div className="nft-gallery">
      <div className="gallery-header">
        <div className="header-left">
          <h2>🖼️ NFT Gallery</h2>
          {isConnected && (
            <span className="nft-count">{filteredNFTs.length} NFT{filteredNFTs.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="header-right">
          {isConnected && nftHoldings.length > 0 && (
            <>
              <input
                type="text"
                placeholder="Filter by name..."
                value={filter === 'all' ? '' : filter}
                onChange={(e) => setFilter(e.target.value || 'all')}
                className="filter-input"
              />
              <div className="view-toggle">
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  ⊞
                </button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  ☰
                </button>
              </div>
              <button onClick={fetchNFTs} className="refresh-nft-btn" disabled={loading}>
                🔄
              </button>
            </>
          )}
        </div>
      </div>

      {!isConnected ? (
        <div className="empty-state">
          <div className="empty-icon">🔌</div>
          <h3>Connect Your Wallet</h3>
          <p>Connect your wallet to view your NFT collection</p>
        </div>
      ) : loading && nftHoldings.length === 0 ? (
        <div className="loading-state">
          <div className="nft-loader"></div>
          <p>Loading your NFT collection...</p>
        </div>
      ) : filteredNFTs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎨</div>
          <h3>{filter === 'all' ? 'No NFTs Found' : 'No Matching NFTs'}</h3>
          <p>
            {filter === 'all'
              ? 'You don\'t have any NFTs in this wallet yet'
              : 'Try adjusting your filter'}
          </p>
        </div>
      ) : (
        <div className={`nft-container ${viewMode}-view`}>
          {filteredNFTs.map((nft, index) => (
            <div
              key={`${nft.assetId}-${index}`}
              className="nft-card"
              onClick={() => openNFTDetails(nft)}
            >
              <div
                className="nft-image"
                style={{ background: generatePlaceholderImage(nft.assetId) }}
              >
                <div className="nft-overlay">
                  <span className="view-details">View Details</span>
                </div>
              </div>
              <div className="nft-info">
                <h4 className="nft-title">{nft.assetName}</h4>
                <p className="nft-contract">{formatAddress(nft.contractId)}</p>
                {nft.count > 1 && (
                  <span className="nft-badge">×{nft.count}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedNFT && (
        <div className="nft-modal" onClick={closeNFTDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeNFTDetails}>×</button>

            <div className="modal-body">
              <div className="modal-image-section">
                <div
                  className="modal-nft-image"
                  style={{ background: generatePlaceholderImage(selectedNFT.assetId) }}
                ></div>
              </div>

              <div className="modal-details-section">
                <h2>{selectedNFT.assetName}</h2>

                <div className="detail-group">
                  <label>Asset Identifier</label>
                  <div className="detail-value copiable">
                    {selectedNFT.assetId}
                  </div>
                </div>

                <div className="detail-group">
                  <label>Contract Address</label>
                  <div className="detail-value copiable">
                    {selectedNFT.contractId}
                  </div>
                </div>

                <div className="detail-group">
                  <label>Value</label>
                  <div className="detail-value">
                    {selectedNFT.value}
                  </div>
                </div>

                <div className="detail-group">
                  <label>Event Type</label>
                  <div className="detail-value">
                    <span className={`event-badge ${selectedNFT.eventType}`}>
                      {selectedNFT.eventType}
                    </span>
                  </div>
                </div>

                <div className="detail-group">
                  <label>Block Height</label>
                  <div className="detail-value">
                    #{selectedNFT.blockHeight.toLocaleString()}
                  </div>
                </div>

                {selectedNFT.count > 1 && (
                  <div className="detail-group">
                    <label>Quantity</label>
                    <div className="detail-value">
                      {selectedNFT.count}
                    </div>
                  </div>
                )}

                <div className="modal-actions">
                  <a
                    href={`https://explorer.hiro.so/txid/${selectedNFT.txId}?chain=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-btn"
                  >
                    View on Explorer →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTGallery;
