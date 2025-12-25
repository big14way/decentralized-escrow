import React from 'react';
import { WalletConnectProvider } from './contexts/WalletConnectContext';
import WalletConnectButton from './components/WalletConnectButton';
import ContractInteraction from './components/ContractInteraction';
import AccountInfo from './components/AccountInfo';
import STXTransfer from './components/STXTransfer';
import './styles/App.css';

function App() {
  return (
    <WalletConnectProvider>
      <div className="App">
        <header className="App-header">
          <h1>Stacks dApp</h1>
          <WalletConnectButton />
        </header>

        <main className="App-main">
          <AccountInfo />

          <div className="features-grid">
            <STXTransfer />
            <ContractInteraction />
          </div>
        </main>

        <footer className="App-footer">
          <p>Built on Stacks • Testnet</p>
        </footer>
      </div>
    </WalletConnectProvider>
  );
}

export default App;
