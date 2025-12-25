import React from 'react';
import { WalletConnectProvider } from './contexts/WalletConnectContext';
import WalletConnectButton from './components/WalletConnectButton';
import NetworkStatus from './components/NetworkStatus';
import ContractInteraction from './components/ContractInteraction';
import AccountInfo from './components/AccountInfo';
import STXTransfer from './components/STXTransfer';
import ContractViewer from './components/ContractViewer';
import TransactionBuilder from './components/TransactionBuilder';
import TransactionHistory from './components/TransactionHistory';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import NFTGallery from './components/NFTGallery';
import TokenPortfolio from './components/TokenPortfolio';
import MultiSigManager from './components/MultiSigManager';
import './styles/App.css';

function App() {
  return (
    <WalletConnectProvider>
      <div className="App">
        <header className="App-header">
          <div className="header-content">
            <h1>Stacks dApp</h1>
            <WalletConnectButton />
          </div>
        </header>

        <main className="App-main">
          <NetworkStatus />

          <AnalyticsDashboard />

          <MultiSigManager />

          <TokenPortfolio />

          <NFTGallery />

          <AccountInfo />

          <div className="features-grid">
            <STXTransfer />
            <ContractInteraction />
          </div>

          <TransactionBuilder />

          <div className="advanced-section">
            <ContractViewer />
            <TransactionHistory />
          </div>
        </main>

        <footer className="App-footer">
          <p>Built on Stacks • Testnet • Powered by Clarity Smart Contracts</p>
        </footer>
      </div>
    </WalletConnectProvider>
  );
}

export default App;
