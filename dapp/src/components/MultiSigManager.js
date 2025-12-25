import React, { useState, useEffect } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/MultiSigManager.css';

const MultiSigManager = () => {
  const { account, isConnected } = useWalletConnect();
  const [proposals, setProposals] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [filter, setFilter] = useState('all');

  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    recipient: '',
    amount: '',
    type: 'transfer'
  });

  useEffect(() => {
    if (isConnected) {
      loadProposals();
    }
  }, [isConnected]);

  const loadProposals = () => {
    // Load from localStorage
    const saved = localStorage.getItem('multisig-proposals');
    if (saved) {
      setProposals(JSON.parse(saved));
    } else {
      // Initialize with sample data
      const sampleProposals = [
        {
          id: 1,
          title: 'Treasury Allocation for Development',
          description: 'Allocate 10,000 STX from treasury for Q1 development costs',
          creator: account || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          recipient: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
          amount: '10000',
          type: 'transfer',
          status: 'active',
          votes: { yes: 3, no: 1 },
          voters: [],
          requiredVotes: 5,
          createdAt: Date.now() - 86400000,
          expiresAt: Date.now() + 604800000
        },
        {
          id: 2,
          title: 'Update Contract Parameters',
          description: 'Increase withdrawal limit from 1000 STX to 5000 STX',
          creator: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC',
          recipient: 'N/A',
          amount: '0',
          type: 'governance',
          status: 'active',
          votes: { yes: 2, no: 0 },
          voters: [],
          requiredVotes: 5,
          createdAt: Date.now() - 172800000,
          expiresAt: Date.now() + 432000000
        },
        {
          id: 3,
          title: 'Add New Signer',
          description: 'Add ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP as authorized signer',
          creator: account || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          recipient: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP',
          amount: '0',
          type: 'signer',
          status: 'passed',
          votes: { yes: 5, no: 0 },
          voters: [],
          requiredVotes: 5,
          createdAt: Date.now() - 259200000,
          expiresAt: Date.now() - 86400000
        }
      ];
      setProposals(sampleProposals);
      saveProposals(sampleProposals);
    }
  };

  const saveProposals = (proposalsList) => {
    localStorage.setItem('multisig-proposals', JSON.stringify(proposalsList));
  };

  const createProposal = (e) => {
    e.preventDefault();

    const proposal = {
      id: Date.now(),
      ...newProposal,
      creator: account,
      status: 'active',
      votes: { yes: 0, no: 0 },
      voters: [],
      requiredVotes: 5,
      createdAt: Date.now(),
      expiresAt: Date.now() + 604800000 // 7 days
    };

    const updated = [proposal, ...proposals];
    setProposals(updated);
    saveProposals(updated);

    setShowCreateModal(false);
    setNewProposal({
      title: '',
      description: '',
      recipient: '',
      amount: '',
      type: 'transfer'
    });
  };

  const voteOnProposal = (proposalId, vote) => {
    if (!account) return;

    const updated = proposals.map(p => {
      if (p.id === proposalId) {
        // Check if already voted
        if (p.voters.includes(account)) {
          return p;
        }

        const newVotes = { ...p.votes };
        newVotes[vote] += 1;

        const totalVotes = newVotes.yes + newVotes.no;
        let newStatus = p.status;

        if (newVotes.yes >= p.requiredVotes) {
          newStatus = 'passed';
        } else if (newVotes.no > (totalVotes - p.requiredVotes)) {
          newStatus = 'rejected';
        }

        return {
          ...p,
          votes: newVotes,
          voters: [...p.voters, account],
          status: newStatus
        };
      }
      return p;
    });

    setProposals(updated);
    saveProposals(updated);
  };

  const getFilteredProposals = () => {
    if (filter === 'all') return proposals;
    return proposals.filter(p => p.status === filter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#3498db';
      case 'passed': return '#2ecc71';
      case 'rejected': return '#e74c3c';
      case 'expired': return '#95a5a6';
      default: return '#7f8c8d';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'transfer': return '💸';
      case 'governance': return '⚙️';
      case 'signer': return '👤';
      default: return '📄';
    }
  };

  const formatAddress = (address) => {
    if (!address || address === 'N/A') return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const filteredProposals = getFilteredProposals();

  return (
    <div className="multisig-manager">
      <div className="manager-header">
        <div className="header-left">
          <h2>🔐 Multi-Sig Wallet Manager</h2>
          <span className="proposal-count">
            {filteredProposals.length} Proposal{filteredProposals.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="header-right">
          <div className="filter-tabs">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={filter === 'active' ? 'active' : ''}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              className={filter === 'passed' ? 'active' : ''}
              onClick={() => setFilter('passed')}
            >
              Passed
            </button>
            <button
              className={filter === 'rejected' ? 'active' : ''}
              onClick={() => setFilter('rejected')}
            >
              Rejected
            </button>
          </div>
          {isConnected && (
            <button onClick={() => setShowCreateModal(true)} className="create-proposal-btn">
              + Create Proposal
            </button>
          )}
        </div>
      </div>

      {!isConnected ? (
        <div className="empty-state">
          <div className="empty-icon">🔒</div>
          <h3>Connect Your Wallet</h3>
          <p>Connect to view and manage multi-sig proposals</p>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Proposals Found</h3>
          <p>Create a new proposal to get started</p>
        </div>
      ) : (
        <div className="proposals-list">
          {filteredProposals.map(proposal => {
            const votePercentage = proposal.votes.yes / proposal.requiredVotes * 100;
            const hasVoted = proposal.voters.includes(account);

            return (
              <div key={proposal.id} className="proposal-card">
                <div className="proposal-header">
                  <div className="proposal-title-section">
                    <span className="type-icon">{getTypeIcon(proposal.type)}</span>
                    <div>
                      <h3 onClick={() => setSelectedProposal(proposal)}>{proposal.title}</h3>
                      <p className="proposal-meta">
                        Created by {formatAddress(proposal.creator)} • {formatTimeAgo(proposal.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(proposal.status) }}
                  >
                    {proposal.status}
                  </span>
                </div>

                <p className="proposal-description">{proposal.description}</p>

                {(proposal.type === 'transfer' || proposal.type === 'signer') && (
                  <div className="proposal-details">
                    <div className="detail-item">
                      <span className="label">
                        {proposal.type === 'transfer' ? 'Recipient:' : 'Address:'}
                      </span>
                      <span className="value">{formatAddress(proposal.recipient)}</span>
                    </div>
                    {proposal.type === 'transfer' && (
                      <div className="detail-item">
                        <span className="label">Amount:</span>
                        <span className="value">{proposal.amount} STX</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="voting-section">
                  <div className="vote-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(votePercentage, 100)}%` }}
                      />
                    </div>
                    <div className="vote-counts">
                      <span className="yes-votes">✓ {proposal.votes.yes}</span>
                      <span className="required-votes">
                        {proposal.votes.yes}/{proposal.requiredVotes} required
                      </span>
                      <span className="no-votes">✗ {proposal.votes.no}</span>
                    </div>
                  </div>

                  {proposal.status === 'active' && !hasVoted && (
                    <div className="vote-buttons">
                      <button
                        onClick={() => voteOnProposal(proposal.id, 'yes')}
                        className="vote-yes"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => voteOnProposal(proposal.id, 'no')}
                        className="vote-no"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {hasVoted && (
                    <div className="voted-message">
                      ✅ You have voted on this proposal
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowCreateModal(false)}>×</button>

            <h2>Create New Proposal</h2>

            <form onSubmit={createProposal} className="proposal-form">
              <div className="form-group">
                <label>Proposal Type *</label>
                <select
                  value={newProposal.type}
                  onChange={(e) => setNewProposal({ ...newProposal, type: e.target.value })}
                  required
                >
                  <option value="transfer">STX Transfer</option>
                  <option value="governance">Governance Change</option>
                  <option value="signer">Add/Remove Signer</option>
                </select>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={newProposal.title}
                  onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                  placeholder="Brief title for this proposal"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={newProposal.description}
                  onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                  placeholder="Detailed description of what this proposal aims to achieve"
                  rows="4"
                  required
                />
              </div>

              {(newProposal.type === 'transfer' || newProposal.type === 'signer') && (
                <div className="form-group">
                  <label>
                    {newProposal.type === 'transfer' ? 'Recipient Address' : 'Signer Address'} *
                  </label>
                  <input
                    type="text"
                    value={newProposal.recipient}
                    onChange={(e) => setNewProposal({ ...newProposal, recipient: e.target.value })}
                    placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
                    required
                  />
                </div>
              )}

              {newProposal.type === 'transfer' && (
                <div className="form-group">
                  <label>Amount (STX) *</label>
                  <input
                    type="number"
                    value={newProposal.amount}
                    onChange={(e) => setNewProposal({ ...newProposal, amount: e.target.value })}
                    placeholder="0.000000"
                    step="0.000001"
                    min="0"
                    required
                  />
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={() => setShowCreateModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Create Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedProposal && (
        <div className="modal-overlay" onClick={() => setSelectedProposal(null)}>
          <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedProposal(null)}>×</button>

            <div className="detail-header">
              <span className="type-icon-large">{getTypeIcon(selectedProposal.type)}</span>
              <div>
                <h2>{selectedProposal.title}</h2>
                <span
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(selectedProposal.status) }}
                >
                  {selectedProposal.status}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Description</h3>
              <p>{selectedProposal.description}</p>
            </div>

            <div className="detail-section">
              <h3>Details</h3>
              <div className="detail-grid">
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{selectedProposal.type}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Creator:</span>
                  <span className="value">{selectedProposal.creator}</span>
                </div>
                {selectedProposal.recipient && selectedProposal.recipient !== 'N/A' && (
                  <div className="detail-row">
                    <span className="label">Recipient:</span>
                    <span className="value">{selectedProposal.recipient}</span>
                  </div>
                )}
                {selectedProposal.amount && selectedProposal.amount !== '0' && (
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value">{selectedProposal.amount} STX</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Created:</span>
                  <span className="value">{new Date(selectedProposal.createdAt).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Expires:</span>
                  <span className="value">{new Date(selectedProposal.expiresAt).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h3>Voting Results</h3>
              <div className="vote-stats">
                <div className="stat-item">
                  <span className="stat-value yes">{selectedProposal.votes.yes}</span>
                  <span className="stat-label">Approve</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value no">{selectedProposal.votes.no}</span>
                  <span className="stat-label">Reject</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{selectedProposal.requiredVotes}</span>
                  <span className="stat-label">Required</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSigManager;
