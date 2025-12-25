import React, { useState, useEffect } from 'react';
import { CONTRACT_CONFIG } from '../config/stacksConfig';
import '../styles/ContractViewer.css';

const ContractViewer = () => {
  
  const [contractInfo, setContractInfo] = useState(null);
  const [contractSource, setContractSource] = useState(null);
  const [readonlyFunctions, setReadonlyFunctions] = useState([]);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [functionResult, setFunctionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContractInfo();
    fetchContractSource();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchContractInfo = async () => {
    try {
      const response = await fetch(
        `https://api.testnet.hiro.so/extended/v1/contract/${CONTRACT_CONFIG.contractAddress}.${CONTRACT_CONFIG.contractName}`
      );
      const data = await response.json();
      setContractInfo(data);
    } catch (err) {
      console.error('Failed to fetch contract info:', err);
    }
  };

  const fetchContractSource = async () => {
    try {
      const response = await fetch(
        `https://api.testnet.hiro.so/v2/contracts/source/${CONTRACT_CONFIG.contractAddress}/${CONTRACT_CONFIG.contractName}`
      );
      const data = await response.json();
      setContractSource(data.source);

      // Parse read-only functions from source
      parseReadonlyFunctions(data.source);
    } catch (err) {
      console.error('Failed to fetch contract source:', err);
    }
  };

  const parseReadonlyFunctions = (source) => {
    if (!source) return;

    const regex = /\(define-read-only\s+\(([a-zA-Z0-9\-]+)/g;
    const functions = [];
    let match;

    while ((match = regex.exec(source)) !== null) {
      functions.push({
        name: match[1],
        type: 'read-only'
      });
    }

    setReadonlyFunctions(functions);
  };

  const callReadonlyFunction = async (functionName) => {
    setLoading(true);
    setError(null);
    setFunctionResult(null);
    setSelectedFunction(functionName);

    try {
      const response = await fetch(
        `https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_CONFIG.contractAddress}/${CONTRACT_CONFIG.contractName}/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sender: CONTRACT_CONFIG.contractAddress,
            arguments: []
          })
        }
      );

      const data = await response.json();

      if (data.okay) {
        setFunctionResult(data.result);
      } else {
        setError(data.cause || 'Function call failed');
      }
    } catch (err) {
      console.error('Failed to call readonly function:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatClarityValue = (value) => {
    if (!value) return 'No result';

    // Handle different Clarity types
    if (value.startsWith('0x')) {
      return `Hex: ${value}`;
    }

    // Try to parse as number
    const num = parseInt(value, 16);
    if (!isNaN(num)) {
      return `Value: ${num}`;
    }

    return value;
  };

  return (
    <div className="contract-viewer">
      <h2>Smart Contract Viewer</h2>

      <div className="contract-details">
        <div className="detail-row">
          <span className="detail-label">Contract Name:</span>
          <span className="detail-value">{CONTRACT_CONFIG.contractName}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Contract Address:</span>
          <span className="detail-value contract-address">
            {CONTRACT_CONFIG.contractAddress}
          </span>
        </div>
        {contractInfo && (
          <>
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className="detail-value status-badge">
                {contractInfo.tx_id ? '✅ Deployed' : '⏳ Pending'}
              </span>
            </div>
            {contractInfo.block_height && (
              <div className="detail-row">
                <span className="detail-label">Block Height:</span>
                <span className="detail-value">{contractInfo.block_height}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="functions-section">
        <h3>Read-Only Functions</h3>
        {readonlyFunctions.length > 0 ? (
          <div className="functions-list">
            {readonlyFunctions.map((func, index) => (
              <div key={index} className="function-item">
                <div className="function-header">
                  <span className="function-name">{func.name}</span>
                  <span className="function-badge">read-only</span>
                </div>
                <button
                  onClick={() => callReadonlyFunction(func.name)}
                  disabled={loading && selectedFunction === func.name}
                  className="call-function-btn"
                >
                  {loading && selectedFunction === func.name ? 'Calling...' : 'Call Function'}
                </button>

                {selectedFunction === func.name && functionResult && (
                  <div className="function-result">
                    <strong>Result:</strong>
                    <pre>{formatClarityValue(functionResult)}</pre>
                  </div>
                )}

                {selectedFunction === func.name && error && (
                  <div className="function-error">
                    <strong>Error:</strong> {error}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-functions">
            {contractSource ? 'No read-only functions found in this contract' : 'Loading contract...'}
          </p>
        )}
      </div>

      {contractSource && (
        <div className="source-section">
          <h3>Contract Source Code</h3>
          <details>
            <summary>View Source Code</summary>
            <pre className="contract-source">{contractSource}</pre>
          </details>
        </div>
      )}

      <div className="explorer-link">
        <a
          href={`https://explorer.hiro.so/txid/${CONTRACT_CONFIG.contractAddress}.${CONTRACT_CONFIG.contractName}?chain=testnet`}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Stacks Explorer →
        </a>
      </div>
    </div>
  );
};

export default ContractViewer;
