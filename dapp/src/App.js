import React from 'react';
import { WalletConnectProvider } from './contexts/WalletConnectContext';
import WalletConnectButton from './components/WalletConnectButton';
import ContractInteraction from './components/ContractInteraction';
import './styles/App.css';

function App() {
  return (
    <WalletConnectProvider>
      <div className="App">
        <header className="App-header">
          <h1>Stacks WalletConnect dApp</h1>
          <WalletConnectButton />
        </header>

        <main className="App-main">
          <div className="container">
            <section className="info-section">
              <h2>Welcome to Stacks WalletConnect Integration</h2>
              <p>
                This dApp demonstrates WalletConnect v2 integration with the Stacks blockchain.
                Connect your Stacks wallet to interact with smart contracts on testnet.
              </p>
              <div className="features">
                <div className="feature">
                  <h3>🔗 Connect</h3>
                  <p>Scan QR code with your Stacks wallet</p>
                </div>
                <div className="feature">
                  <h3>✍️ Sign</h3>
                  <p>Sign messages and transactions</p>
                </div>
                <div className="feature">
                  <h3>📝 Interact</h3>
                  <p>Call smart contract functions</p>
                </div>
              </div>
            </section>

            <ContractInteraction />
          </div>
        </main>

        <footer className="App-footer">
          <p>Built with Stacks.js and WalletConnect v2</p>
          <p>Powered by Clarity smart contracts on Stacks blockchain</p>
        </footer>
      </div>
    </WalletConnectProvider>
  );
}

export default App;
