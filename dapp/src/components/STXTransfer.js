import React, { useState } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import { openSTXTransfer } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';
import '../styles/STXTransfer.css';

const STXTransfer = () => {
  const { isConnected } = useWalletConnect();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState(null);
  const [error, setError] = useState(null);

  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!recipient || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setTxId(null);

    try {
      const amountInMicroStx = Math.floor(parseFloat(amount) * 1000000);

      await openSTXTransfer({
        network: new StacksTestnet(),
        recipient,
        amount: amountInMicroStx.toString(),
        memo: memo || undefined,
        onFinish: (data) => {
          setTxId(data.txId);
          setLoading(false);
          setRecipient('');
          setAmount('');
          setMemo('');
          console.log('Transfer submitted:', data.txId);
        },
        onCancel: () => {
          setLoading(false);
          console.log('Transfer cancelled');
        },
      });
    } catch (err) {
      console.error('Transfer failed:', err);
      setError(err.message || 'Transfer failed');
      setLoading(false);
    }
  };

  return (
    <div className="stx-transfer">
      <h2>Send STX</h2>

      <form onSubmit={handleTransfer} className="transfer-form">
        <div className="form-group">
          <label htmlFor="recipient">Recipient Address *</label>
          <input
            type="text"
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
            disabled={!isConnected || loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (STX) *</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.000000"
            step="0.000001"
            min="0"
            disabled={!isConnected || loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="memo">Memo (optional)</label>
          <input
            type="text"
            id="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Optional message"
            maxLength="34"
            disabled={!isConnected || loading}
          />
        </div>

        <button
          type="submit"
          disabled={!isConnected || loading || !recipient || !amount}
          className="transfer-btn"
        >
          {loading ? 'Sending...' : 'Send STX'}
        </button>
      </form>

      {txId && (
        <div className="success-message">
          <p>✅ Transfer submitted successfully!</p>
          <p className="tx-id">TX ID: {txId.slice(0, 8)}...{txId.slice(-6)}</p>
          <a
            href={`https://explorer.hiro.so/txid/${txId}?chain=testnet`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Explorer →
          </a>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>❌ {error}</p>
        </div>
      )}

      {!isConnected && (
        <div className="info-message">
          <p>Connect your wallet to send STX</p>
        </div>
      )}
    </div>
  );
};

export default STXTransfer;
