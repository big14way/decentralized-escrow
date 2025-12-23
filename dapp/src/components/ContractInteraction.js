import React, { useState } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import { CONTRACT_CONFIG } from '../config/stacksConfig';
import '../styles/ContractInteraction.css';

const ContractInteraction = () => {
  const { callContract, isConnected, account } = useWalletConnect();
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState(null);
  const [error, setError] = useState(null);

  const handleContractCall = async () => {
    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setTxId(null);

    try {
      const result = await callContract(
        CONTRACT_CONFIG.contractAddress,
        CONTRACT_CONFIG.contractName,
        'read-only-function',
        []
      );

      setTxId(result.txid || 'Success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contract-interaction">
      <h2>Contract Interaction</h2>
      <div className="contract-info">
        <p><strong>Contract:</strong> {CONTRACT_CONFIG.contractName}</p>
        <p><strong>Address:</strong> {CONTRACT_CONFIG.contractAddress}</p>
      </div>

      <button
        onClick={handleContractCall}
        disabled={!isConnected || loading}
        className="call-btn"
      >
        {loading ? 'Calling Contract...' : 'Call Contract'}
      </button>

      {txId && (
        <div className="success">
          <p>Transaction successful!</p>
          <p className="txid">TX ID: {txId}</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default ContractInteraction;
