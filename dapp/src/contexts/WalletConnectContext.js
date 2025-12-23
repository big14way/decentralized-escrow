import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksTestnet } from '@stacks/network';

const WalletConnectContext = createContext();

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export const useWalletConnect = () => {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error('useWalletConnect must be used within WalletConnectProvider');
  }
  return context;
};

export const WalletConnectProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      showConnect({
        appDetails: {
          name: 'Stacks dApp',
          icon: window.location.origin + '/logo192.png',
        },
        redirectTo: '/',
        onFinish: () => {
          setUserData(userSession.loadUserData());
          setIsConnecting(false);
        },
        onCancel: () => {
          setIsConnecting(false);
        },
        userSession,
        // Enable WalletConnect support
        walletConnectProjectId: '1eebe528ca0ce94a99ceaa2e915058d7',
      });
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err.message);
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    userSession.signUserOut();
    setUserData(null);
  }, []);

  const getAddress = useCallback(() => {
    if (!userData) return null;
    return userData.profile.stxAddress.testnet;
  }, [userData]);

  const value = {
    userData,
    userSession,
    isConnected: !!userData,
    isConnecting,
    error,
    connect,
    disconnect,
    account: getAddress(),
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
};
