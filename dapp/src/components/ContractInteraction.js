import React, { useState } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import { openContractCall } from '@stacks/connect';
import { PostConditionMode } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import { CONTRACT_CONFIG } from '../config/stacksConfig';
import '../styles/ContractInteraction.css';

const ContractInteraction = () => {
  const { isConnected } = useWalletConnect();
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState(null);
  const [txError, setTxError] = useState(null);

  const handleContractCall = async () => {
    if (!isConnected) {
      setTxError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setTxError(null);
    setTxId(null);

    try {
      // Example contract call - customize based on your contract
      await openContractCall({
        network: new StacksTestnet(),
        contractAddress: CONTRACT_CONFIG.contractAddress,
        contractName: CONTRACT_CONFIG.contractName,
        functionName: 'example-function', // Replace with your function
        functionArgs: [
          // Add your function arguments here
          // Example: uintCV(100)
        ],
        postConditionMode: PostConditionMode.Deny,
        postConditions: [],
        onFinish: (data) => {
          setTxId(data.txId);
          setLoading(false);
          console.log('Transaction submitted:', data.txId);
        },
        onCancel: () => {
          setLoading(false);
          console.log('Transaction cancelled');
        },
      });
    } catch (err) {
      console.error('Contract call failed:', err);
      setTxError(err.message);
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
        className="call-contract-btn"
      >
        {loading ? 'Calling Contract...' : 'Call Contract'}
      </button>

      {txId && (
        <div className="success-message">
          <p>✅ Transaction submitted!</p>
          <p className="tx-id">TX ID: {txId}</p>
          <a
            href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer
          </a>
        </div>
      )}

      {txError && (
        <div className="error-message">
          <p>❌ Error: {txError}</p>
        </div>
      )}

      {!isConnected && (
        <div className="info-message">
          <p>Please connect your wallet to interact with the contract</p>
        </div>
      )}
    </div>
  );
};

export default ContractInteraction;
