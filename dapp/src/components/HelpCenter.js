import React, { useState } from 'react';
import '../styles/HelpCenter.css';

const HelpCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState([]);

  const categories = [
    { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
    { id: 'wallet', label: 'Wallet & Accounts', icon: '👛' },
    { id: 'transactions', label: 'Transactions', icon: '💸' },
    { id: 'contracts', label: 'Smart Contracts', icon: '📝' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' }
  ];

  const helpContent = {
    'getting-started': [
      {
        id: 'gs-1',
        question: 'How do I connect my wallet?',
        answer: 'Click the Connect Wallet button at the top of the page. Select your preferred wallet provider (Hiro Wallet, Xverse, etc.) and approve the connection request. Make sure you have a Stacks wallet installed as a browser extension.'
      },
      {
        id: 'gs-2',
        question: 'What is the Stacks blockchain?',
        answer: 'Stacks is a Bitcoin layer that enables smart contracts and decentralized applications. It uses a unique Proof of Transfer (PoX) consensus mechanism that is anchored to Bitcoin, making it more secure and decentralized.'
      },
      {
        id: 'gs-3',
        question: 'How do I get testnet STX?',
        answer: 'Use the testnet faucet available through the Quick Actions menu (lightning bolt icon). Click on Testnet Faucet to open the Hiro faucet where you can request free testnet STX for development and testing purposes.'
      },
      {
        id: 'gs-4',
        question: 'What features are available in this dApp?',
        answer: 'This dApp includes multiple features: wallet connection, STX transfers, contract interactions, NFT gallery, token portfolio, multi-sig proposals, activity feed, notifications, quick actions, and advanced search. Explore each section to discover all capabilities.'
      }
    ],
    'wallet': [
      {
        id: 'w-1',
        question: 'How do I view my wallet balance?',
        answer: 'Once connected, your STX balance is displayed in the Account Info section. You can also use the Quick Actions menu and select View Balance to navigate directly to your account information.'
      },
      {
        id: 'w-2',
        question: 'Can I connect multiple wallets?',
        answer: 'You can only connect one wallet at a time. To switch wallets, disconnect your current wallet first, then connect with a different one. Your session data is stored per wallet address.'
      },
      {
        id: 'w-3',
        question: 'How do I copy my wallet address?',
        answer: 'Use the Quick Actions menu (lightning bolt icon) and click Copy Address. Your wallet address will be copied to your clipboard. You can also find your address displayed in the Account Info section.'
      },
      {
        id: 'w-4',
        question: 'Is my wallet secure?',
        answer: 'Your wallet private keys never leave your wallet extension. This dApp only requests permission to read your address and sign transactions. Always verify transaction details before signing, and never share your seed phrase.'
      }
    ],
    'transactions': [
      {
        id: 't-1',
        question: 'How do I send STX?',
        answer: 'Use the Quick Actions menu (lightning bolt icon) and select Send STX. Enter the recipient address, amount, and optional memo. Review the transaction details carefully before confirming. The transaction will appear in your Activity Feed once processed.'
      },
      {
        id: 't-2',
        question: 'How long do transactions take?',
        answer: 'Transaction confirmation times vary based on network activity. Typically, transactions are confirmed within 10-15 minutes on the Stacks blockchain. You can track your transaction status in the Activity Feed or on a block explorer.'
      },
      {
        id: 't-3',
        question: 'What are transaction fees?',
        answer: 'Transaction fees (gas fees) are paid in STX to compensate network validators. The fee amount depends on transaction complexity and network congestion. Fees are automatically calculated and displayed before you confirm any transaction.'
      },
      {
        id: 't-4',
        question: 'Can I cancel a pending transaction?',
        answer: 'Once a transaction is broadcast to the network, it cannot be cancelled. However, if a transaction is stuck, you may be able to speed it up by submitting a replacement transaction with a higher fee. Always double-check transaction details before confirming.'
      }
    ],
    'contracts': [
      {
        id: 'c-1',
        question: 'What are smart contracts?',
        answer: 'Smart contracts are self-executing programs stored on the blockchain. They automatically execute when predetermined conditions are met. On Stacks, smart contracts are written in Clarity, a decidable language designed for security and predictability.'
      },
      {
        id: 'c-2',
        question: 'How do I interact with a contract?',
        answer: 'Use the Contract Viewer to load a contract by entering its address and name. You can view the contract source code and call read-only functions. For write operations, use the Transaction Builder to construct and submit contract calls.'
      },
      {
        id: 'c-3',
        question: 'What is Clarity?',
        answer: 'Clarity is the smart contract language for Stacks. It is a decidable language, meaning you can know what a program will do before executing it. This prevents many common smart contract vulnerabilities and makes contracts more secure.'
      },
      {
        id: 'c-4',
        question: 'How do I verify a contract?',
        answer: 'Contract source code is published on-chain with every deployment. You can view and verify any contract using the Contract Viewer or by checking the contract on the Stacks Explorer. Always review contract code before interacting with it.'
      }
    ],
    'security': [
      {
        id: 's-1',
        question: 'How do I keep my wallet safe?',
        answer: 'Never share your seed phrase or private keys. Always verify URLs and contract addresses. Review all transaction details before signing. Use hardware wallets for large amounts. Enable all available security features in your wallet extension.'
      },
      {
        id: 's-2',
        question: 'What should I verify before signing?',
        answer: 'Check the recipient address, transaction amount, contract being called, function name, and fee amount. Make sure the website URL is correct. If anything looks suspicious or unexpected, do not sign the transaction.'
      },
      {
        id: 's-3',
        question: 'What is a seed phrase?',
        answer: 'A seed phrase (also called recovery phrase or mnemonic) is a list of 12 or 24 words that can restore your wallet. Write it down and store it safely offline. Never enter it on websites or share it with anyone. Anyone with your seed phrase can access your funds.'
      },
      {
        id: 's-4',
        question: 'How can I report a security issue?',
        answer: 'If you discover a security vulnerability, please report it responsibly. Use the Support option in Quick Actions to access our security contact information. Do not publicly disclose security issues before they are addressed.'
      }
    ],
    'troubleshooting': [
      {
        id: 'tr-1',
        question: 'Wallet connection is not working',
        answer: 'Make sure you have a Stacks wallet extension installed (Hiro Wallet or Xverse). Try refreshing the page and reconnecting. Check that your wallet is unlocked. Clear browser cache if the issue persists. Make sure you are using a supported browser (Chrome, Firefox, Brave).'
      },
      {
        id: 'tr-2',
        question: 'Transaction is stuck or pending',
        answer: 'Network congestion can cause delays. Wait 15-30 minutes and check the Activity Feed for updates. You can view the transaction on a block explorer using the transaction ID. If stuck for hours, the transaction may have failed - check your wallet for status updates.'
      },
      {
        id: 'tr-3',
        question: 'Balance is not showing correctly',
        answer: 'Click the Refresh Data option in Quick Actions to reload blockchain data. Network delays can cause temporary balance discrepancies. Check your address on the Stacks Explorer to verify the actual on-chain balance. Clear your browser cache if the issue persists.'
      },
      {
        id: 'tr-4',
        question: 'Contract interaction failed',
        answer: 'Check that you have sufficient STX for the transaction and fees. Verify the contract address and function parameters. Some contract functions may have specific requirements or conditions. Review the error message for details. Try with a different wallet or browser if issues continue.'
      }
    ]
  };

  const toggleItem = (itemId) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const filteredContent = () => {
    const items = helpContent[selectedCategory] || [];
    if (!searchQuery.trim()) return items;

    return items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const quickLinks = [
    { label: 'Stacks Documentation', url: 'https://docs.stacks.co/', icon: '📚' },
    { label: 'Block Explorer', url: 'https://explorer.hiro.so/?chain=testnet', icon: '🔍' },
    { label: 'Testnet Faucet', url: 'https://explorer.hiro.so/sandbox/faucet?chain=testnet', icon: '💧' },
    { label: 'Community Forum', url: 'https://forum.stacks.org/', icon: '💬' }
  ];

  return (
    <>
      <button
        className="help-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Help & Documentation"
      >
        ❓
      </button>

      {isOpen && (
        <div className="help-center-modal">
          <div className="help-backdrop" onClick={() => setIsOpen(false)} />
          <div className="help-content">
            <div className="help-header">
              <h2>❓ Help Center</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="help-search">
              <input
                type="text"
                className="help-search-input"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="help-body">
              <div className="help-sidebar">
                <h3>Categories</h3>
                {categories.map(category => (
                  <button
                    key={category.id}
                    className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSearchQuery('');
                    }}
                  >
                    <span className="category-icon">{category.icon}</span>
                    <span className="category-label">{category.label}</span>
                  </button>
                ))}
              </div>

              <div className="help-main">
                {searchQuery && (
                  <div className="search-results-header">
                    <h3>Search Results ({filteredContent().length})</h3>
                  </div>
                )}

                <div className="help-items">
                  {filteredContent().length > 0 ? (
                    filteredContent().map(item => (
                      <div key={item.id} className="help-item">
                        <button
                          className="help-question"
                          onClick={() => toggleItem(item.id)}
                        >
                          <span className="question-text">{item.question}</span>
                          <span className="expand-icon">
                            {expandedItems.includes(item.id) ? '▼' : '▶'}
                          </span>
                        </button>
                        {expandedItems.includes(item.id) && (
                          <div className="help-answer">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="help-empty">
                      <div className="empty-icon">🔍</div>
                      <h3>No results found</h3>
                      <p>Try searching with different keywords</p>
                    </div>
                  )}
                </div>

                <div className="quick-links-section">
                  <h3>📌 Quick Links</h3>
                  <div className="quick-links-grid">
                    {quickLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="quick-link-card"
                      >
                        <span className="link-icon">{link.icon}</span>
                        <span className="link-label">{link.label}</span>
                        <span className="link-arrow">→</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="help-footer">
              <p>Still need help? Contact support through the Quick Actions menu</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HelpCenter;
