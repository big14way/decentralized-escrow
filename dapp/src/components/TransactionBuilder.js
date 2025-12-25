import React, { useState } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import { openContractCall } from '@stacks/connect';
import {
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
  bufferCV,
  trueCV,
  falseCV,
  principalCV,
  PostConditionMode
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import { CONTRACT_CONFIG } from '../config/stacksConfig';
import '../styles/TransactionBuilder.css';

const TransactionBuilder = () => {
  const { isConnected, account } = useWalletConnect();
  const [functionName, setFunctionName] = useState('');
  const [args, setArgs] = useState([{ type: 'uint', value: '' }]);
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState(null);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const argTypes = [
    { value: 'uint', label: 'Unsigned Integer (uint)' },
    { value: 'int', label: 'Signed Integer (int)' },
    { value: 'bool', label: 'Boolean (bool)' },
    { value: 'principal', label: 'Principal (address)' },
    { value: 'string-ascii', label: 'ASCII String' },
    { value: 'string-utf8', label: 'UTF-8 String' },
    { value: 'buffer', label: 'Buffer (hex)' }
  ];

  const addArgument = () => {
    setArgs([...args, { type: 'uint', value: '' }]);
  };

  const removeArgument = (index) => {
    setArgs(args.filter((_, i) => i !== index));
  };

  const updateArgument = (index, field, value) => {
    const newArgs = [...args];
    newArgs[index][field] = value;
    setArgs(newArgs);
  };

  const convertToClarityValue = (arg) => {
    switch (arg.type) {
      case 'uint':
        return uintCV(arg.value);
      case 'int':
        return uintCV(arg.value);
      case 'bool':
        return arg.value === 'true' ? trueCV() : falseCV();
      case 'principal':
        return principalCV(arg.value);
      case 'string-ascii':
        return stringAsciiCV(arg.value);
      case 'string-utf8':
        return stringUtf8CV(arg.value);
      case 'buffer':
        return bufferCV(Buffer.from(arg.value, 'hex'));
      default:
        return uintCV(0);
    }
  };

  const buildTransaction = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      setError('Please connect your wallet first');
      return;
    }

    if (!functionName) {
      setError('Please enter a function name');
      return;
    }

    setLoading(true);
    setError(null);
    setTxId(null);

    try {
      const functionArgs = args
        .filter(arg => arg.value !== '')
        .map(arg => convertToClarityValue(arg));

      await openContractCall({
        network: new StacksTestnet(),
        contractAddress: CONTRACT_CONFIG.contractAddress,
        contractName: CONTRACT_CONFIG.contractName,
        functionName: functionName,
        functionArgs: functionArgs,
        postConditionMode: PostConditionMode.Allow,
        postConditions: [],
        onFinish: (data) => {
          setTxId(data.txId);
          setLoading(false);
          console.log('Transaction submitted:', data.txId);

          // Save to history
          saveToHistory({
            txId: data.txId,
            functionName,
            args: args.filter(arg => arg.value !== ''),
            timestamp: Date.now()
          });
        },
        onCancel: () => {
          setLoading(false);
          console.log('Transaction cancelled');
        },
      });
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(err.message || 'Transaction failed');
      setLoading(false);
    }
  };

  const saveToHistory = (tx) => {
    const history = JSON.parse(localStorage.getItem('txHistory') || '[]');
    history.unshift(tx);
    localStorage.setItem('txHistory', JSON.stringify(history.slice(0, 20)));
  };

  const populateExample = () => {
    setFunctionName('transfer');
    setArgs([
      { type: 'uint', value: '1000000' },
      { type: 'principal', value: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' },
      { type: 'string-utf8', value: 'Example transfer' }
    ]);
  };

  return (
    <div className="transaction-builder">
      <div className="builder-header">
        <h2>Transaction Builder</h2>
        <button onClick={populateExample} className="example-btn">
          Load Example
        </button>
      </div>

      <form onSubmit={buildTransaction} className="builder-form">
        <div className="form-section">
          <h3>Contract Details</h3>
          <div className="contract-info-row">
            <div className="info-item">
              <label>Contract:</label>
              <span>{CONTRACT_CONFIG.contractName}</span>
            </div>
            <div className="info-item">
              <label>Address:</label>
              <span className="address-short">
                {CONTRACT_CONFIG.contractAddress.slice(0, 10)}...
              </span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Function</h3>
          <div className="form-group">
            <label htmlFor="functionName">Function Name *</label>
            <input
              type="text"
              id="functionName"
              value={functionName}
              onChange={(e) => setFunctionName(e.target.value)}
              placeholder="e.g., transfer, mint, burn"
              disabled={!isConnected || loading}
              required
            />
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Arguments</h3>
            <button
              type="button"
              onClick={addArgument}
              className="add-arg-btn"
              disabled={!isConnected || loading}
            >
              + Add Argument
            </button>
          </div>

          <div className="arguments-list">
            {args.map((arg, index) => (
              <div key={index} className="argument-row">
                <div className="arg-index">{index + 1}</div>
                <select
                  value={arg.type}
                  onChange={(e) => updateArgument(index, 'type', e.target.value)}
                  className="arg-type-select"
                  disabled={!isConnected || loading}
                >
                  {argTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={arg.value}
                  onChange={(e) => updateArgument(index, 'value', e.target.value)}
                  placeholder={`Enter ${arg.type} value`}
                  className="arg-value-input"
                  disabled={!isConnected || loading}
                />
                {args.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArgument(index)}
                    className="remove-arg-btn"
                    disabled={!isConnected || loading}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="form-section">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="toggle-advanced-btn"
          >
            {showAdvanced ? '▼' : '▶'} Advanced Options
          </button>

          {showAdvanced && (
            <div className="advanced-options">
              <p className="info-text">
                Post Condition Mode: <strong>Allow</strong>
              </p>
              <p className="info-text">
                Network: <strong>Stacks Testnet</strong>
              </p>
              <p className="info-text">
                Sender: <strong>{account || 'Not connected'}</strong>
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!isConnected || loading || !functionName}
          className="submit-btn"
        >
          {loading ? 'Building Transaction...' : 'Build & Execute Transaction'}
        </button>
      </form>

      {txId && (
        <div className="success-message">
          <p>✅ Transaction submitted successfully!</p>
          <p className="tx-id">TX ID: {txId.slice(0, 10)}...{txId.slice(-8)}</p>
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
          <p>Connect your wallet to build and execute transactions</p>
        </div>
      )}
    </div>
  );
};

export default TransactionBuilder;
