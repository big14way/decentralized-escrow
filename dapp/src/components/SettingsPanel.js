import React, { useState, useEffect } from 'react';
import { useWalletConnect } from '../contexts/WalletConnectContext';
import '../styles/SettingsPanel.css';

const SettingsPanel = () => {
  const { account } = useWalletConnect();

  // Load settings from localStorage or use defaults
  const loadSettings = () => {
    const saved = localStorage.getItem('dapp-settings');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      theme: 'light',
      network: 'testnet',
      notifications: {
        transactions: true,
        proposals: true,
        nftActivity: true,
        priceAlerts: false
      },
      display: {
        currency: 'USD',
        language: 'en',
        dateFormat: 'relative',
        compactNumbers: true
      },
      privacy: {
        showBalance: true,
        showHistory: true,
        analyticsEnabled: true
      },
      advanced: {
        autoRefresh: true,
        refreshInterval: 30,
        gasEstimation: true,
        confirmations: 1
      }
    };
  };

  const [settings, setSettings] = useState(loadSettings);
  const [activeTab, setActiveTab] = useState('general');
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dapp-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' && !Array.isArray(prev[category])
        ? { ...prev[category], [key]: value }
        : value
    }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('dapp-settings', JSON.stringify(settings));
    setShowSaveNotification(true);
    setHasUnsavedChanges(false);
    setTimeout(() => setShowSaveNotification(false), 3000);

    // Apply theme immediately
    document.documentElement.setAttribute('data-theme', settings.theme);
  };

  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
      const defaults = {
        theme: 'light',
        network: 'testnet',
        notifications: {
          transactions: true,
          proposals: true,
          nftActivity: true,
          priceAlerts: false
        },
        display: {
          currency: 'USD',
          language: 'en',
          dateFormat: 'relative',
          compactNumbers: true
        },
        privacy: {
          showBalance: true,
          showHistory: true,
          analyticsEnabled: true
        },
        advanced: {
          autoRefresh: true,
          refreshInterval: 30,
          gasEstimation: true,
          confirmations: 1
        }
      };
      setSettings(defaults);
      localStorage.setItem('dapp-settings', JSON.stringify(defaults));
      setShowSaveNotification(true);
      setHasUnsavedChanges(false);
      setTimeout(() => setShowSaveNotification(false), 3000);
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dapp-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          setSettings(imported);
          setHasUnsavedChanges(true);
          alert('Settings imported successfully!');
        } catch (error) {
          alert('Error importing settings. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'display', label: 'Display', icon: '🎨' },
    { id: 'privacy', label: 'Privacy', icon: '🔒' },
    { id: 'advanced', label: 'Advanced', icon: '🔧' }
  ];

  if (!account) {
    return (
      <div className="settings-panel">
        <div className="settings-empty">
          <div className="empty-icon">🔒</div>
          <h3>Connect Your Wallet</h3>
          <p>Please connect your wallet to access settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <div className="settings-title">
          <h2>⚙️ Settings</h2>
          <p>Customize your dApp experience</p>
        </div>
        {hasUnsavedChanges && (
          <div className="unsaved-indicator">
            <span className="unsaved-dot"></span>
            Unsaved changes
          </div>
        )}
      </div>

      {showSaveNotification && (
        <div className="save-notification">
          ✅ Settings saved successfully!
        </div>
      )}

      <div className="settings-container">
        <div className="settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>General Settings</h3>

              <div className="setting-group">
                <label className="setting-label">
                  <span className="label-text">Theme</span>
                  <span className="label-description">Choose your preferred color scheme</span>
                </label>
                <select
                  className="setting-select"
                  value={settings.theme}
                  onChange={(e) => updateSetting('theme', null, e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  <span className="label-text">Network</span>
                  <span className="label-description">Select the Stacks network</span>
                </label>
                <select
                  className="setting-select"
                  value={settings.network}
                  onChange={(e) => updateSetting('network', null, e.target.value)}
                >
                  <option value="testnet">Testnet</option>
                  <option value="mainnet">Mainnet</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  <span className="label-text">Connected Account</span>
                  <span className="label-description">Your current wallet address</span>
                </label>
                <div className="account-display">
                  <code>{account}</code>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3>Notification Preferences</h3>

              <div className="setting-group">
                <label className="setting-toggle">
                  <div className="toggle-info">
                    <span className="label-text">Transaction Notifications</span>
                    <span className="label-description">Get notified about transaction status</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.transactions}
                    onChange={(e) => updateSetting('notifications', 'transactions', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-toggle">
                  <div className="toggle-info">
                    <span className="label-text">Proposal Updates</span>
                    <span className="label-description">Notifications for proposal voting and results</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.proposals}
                    onChange={(e) => updateSetting('notifications', 'proposals', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-toggle">
                  <div className="toggle-info">
                    <span className="label-text">NFT Activity</span>
                    <span className="label-description">Updates about your NFT collection</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.nftActivity}
                    onChange={(e) => updateSetting('notifications', 'nftActivity', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-toggle">
                  <div className="toggle-info">
                    <span className="label-text">Price Alerts</span>
                    <span className="label-description">Notifications for significant price changes</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifications.priceAlerts}
                    onChange={(e) => updateSetting('notifications', 'priceAlerts', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="settings-section">
              <h3>Display Preferences</h3>

              <div className="setting-group">
                <label className="setting-label">
                  <span className="label-text">Currency</span>
                  <span className="label-description">Display prices in your preferred currency</span>
                </label>
                <select
                  className="setting-select"
                  value={settings.display.currency}
                  onChange={(e) => updateSetting('display', 'currency', e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="BTC">BTC (₿)</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  <span className="label-text">Language</span>
                  <span className="label-description">Choose interface language</span>
                </label>
                <select
                  className="setting-select"
                  value={settings.display.language}
                  onChange={(e) => updateSetting('display', 'language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="zh">中文</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  <span className="label-text">Date Format</span>
                  <span className="label-description">How timestamps are displayed</span>
                </label>
                <select
                  className="setting-select"
                  value={settings.display.dateFormat}
                  onChange={(e) => updateSetting('display', 'dateFormat', e.target.value)}
                >
                  <option value="relative">Relative (2 hours ago)</option>
                  <option value="absolute">Absolute (Dec 25, 2025)</option>
                  <option value="iso">ISO 8601 (2025-12-25)</option>
                </select>
              </div>

              <div className="setting-group">
                <label className="setting-toggle">
                  <div className="toggle-info">
                    <span className="label-text">Compact Numbers</span>
                    <span className="label-description">Show 1.5K instead of 1,500</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.display.compactNumbers}
                    onChange={(e) => updateSetting('display', 'compactNumbers', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h3>Privacy & Security</h3>

              <div className="setting-group">
                <label className="setting-toggle">
                  <div className="toggle-info">
                    <span className="label-text">Show Balance</span>
                    <span className="label-description">Display your wallet balance</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacy.showBalance}
                    onChange={(e) => updateSetting('privacy', 'showBalance', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-toggle">
                  <div className="toggle-info">
                    <span className="label-text">Show Transaction History</span>
                    <span className="label-description">Display your past transactions</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacy.showHistory}
                    onChange={(e) => updateSetting('privacy', 'showHistory', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-toggle">
                  <div className="toggle-info">
                    <span className="label-text">Analytics</span>
                    <span className="label-description">Help improve the dApp with anonymous usage data</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.privacy.analyticsEnabled}
                    onChange={(e) => updateSetting('privacy', 'analyticsEnabled', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="privacy-notice">
                <div className="notice-icon">🔒</div>
                <div className="notice-content">
                  <strong>Privacy Notice</strong>
                  <p>Your settings are stored locally in your browser. We never collect or transmit personal data without your consent.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="settings-section">
              <h3>Advanced Settings</h3>

              <div className="setting-group">
                <label className="setting-toggle">
                  <div className="toggle-info">
                    <span className="label-text">Auto Refresh</span>
                    <span className="label-description">Automatically refresh data periodically</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.advanced.autoRefresh}
                    onChange={(e) => updateSetting('advanced', 'autoRefresh', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  <span className="label-text">Refresh Interval</span>
                  <span className="label-description">How often to refresh data (seconds)</span>
                </label>
                <input
                  type="number"
                  className="setting-input"
                  min="10"
                  max="300"
                  value={settings.advanced.refreshInterval}
                  onChange={(e) => updateSetting('advanced', 'refreshInterval', parseInt(e.target.value))}
                  disabled={!settings.advanced.autoRefresh}
                />
              </div>

              <div className="setting-group">
                <label className="setting-toggle">
                  <div className="toggle-info">
                    <span className="label-text">Gas Estimation</span>
                    <span className="label-description">Show estimated transaction fees</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.advanced.gasEstimation}
                    onChange={(e) => updateSetting('advanced', 'gasEstimation', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-group">
                <label className="setting-label">
                  <span className="label-text">Required Confirmations</span>
                  <span className="label-description">Number of block confirmations needed</span>
                </label>
                <input
                  type="number"
                  className="setting-input"
                  min="1"
                  max="10"
                  value={settings.advanced.confirmations}
                  onChange={(e) => updateSetting('advanced', 'confirmations', parseInt(e.target.value))}
                />
              </div>

              <div className="advanced-actions">
                <button className="action-button export" onClick={exportSettings}>
                  📥 Export Settings
                </button>
                <label className="action-button import">
                  📤 Import Settings
                  <input
                    type="file"
                    accept="application/json"
                    onChange={importSettings}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="settings-footer">
        <button className="footer-button reset" onClick={resetSettings}>
          Reset to Defaults
        </button>
        <div className="footer-actions">
          <button
            className="footer-button cancel"
            onClick={() => {
              setSettings(loadSettings());
              setHasUnsavedChanges(false);
            }}
            disabled={!hasUnsavedChanges}
          >
            Cancel
          </button>
          <button
            className="footer-button save"
            onClick={saveSettings}
            disabled={!hasUnsavedChanges}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
