import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Client from '@walletconnect/sign-client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { WALLET_CONNECT_PROJECT_ID, NETWORK_CONFIG, APP_METADATA } from '../config/stacksConfig';

const WalletConnectContext = createContext();

// Enable BigInt serialization
BigInt.prototype.toJSON = function() { return this.toString(); };

export const useWalletConnect = () => {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error('useWalletConnect must be used within WalletConnectProvider');
  }
  return context;
};

export const WalletConnectProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(NETWORK_CONFIG.testnet.chainId);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize WalletConnect client
  useEffect(() => {
    const initializeClient = async () => {
      try {
        const c = await Client.init({
          logger: 'debug',
          relayUrl: NETWORK_CONFIG.testnet.wsUrl,
          projectId: WALLET_CONNECT_PROJECT_ID,
          metadata: APP_METADATA,
        });

        setClient(c);

        // Restore existing session if available
        if (c.session.length > 0) {
          const lastSession = c.session.keys[c.session.keys.length - 1];
          const restoredSession = c.session.get(lastSession);
          setSession(restoredSession);
          const addr = restoredSession.namespaces.stacks.accounts[0].split(':')[2];
          setAccount(addr);
        }
      } catch (err) {
        console.error('Failed to initialize WalletConnect:', err);
        setError(err.message);
      }
    };

    if (!client) {
      initializeClient();
    }
  }, [client]);

  const connect = useCallback(async () => {
    if (!client) {
      setError('WalletConnect client not initialized');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const { uri, approval } = await client.connect({
        pairingTopic: undefined,
        requiredNamespaces: {
          stacks: {
            methods: [
              'stacks_signMessage',
              'stacks_stxTransfer',
              'stacks_contractCall',
              'stacks_contractDeploy',
            ],
            chains: [chainId],
            events: [],
          },
        },
      });

      if (uri) {
        QRCodeModal.open(uri, () => {
          console.log('QR Code Modal closed');
        });
      }

      const newSession = await approval();
      setSession(newSession);
      const addr = newSession.namespaces.stacks.accounts[0].split(':')[2];
      setAccount(addr);

      QRCodeModal.close();
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, [client, chainId]);

  const disconnect = useCallback(async () => {
    if (!client || !session) return;

    try {
      await client.disconnect({
        topic: session.topic,
        reason: { code: 6000, message: 'User disconnected' },
      });
      setSession(null);
      setAccount(null);
    } catch (err) {
      console.error('Disconnect failed:', err);
      setError(err.message);
    }
  }, [client, session]);

  const signMessage = useCallback(async (message) => {
    if (!client || !session || !account) {
      throw new Error('Not connected');
    }

    try {
      const result = await client.request({
        chainId,
        topic: session.topic,
        request: {
          method: 'stacks_signMessage',
          params: { pubkey: account, message },
        },
      });
      return result;
    } catch (err) {
      console.error('Sign message failed:', err);
      throw err;
    }
  }, [client, session, account, chainId]);

  const transferSTX = useCallback(async (recipient, amount) => {
    if (!client || !session || !account) {
      throw new Error('Not connected');
    }

    try {
      const result = await client.request({
        chainId,
        topic: session.topic,
        request: {
          method: 'stacks_stxTransfer',
          params: {
            pubkey: account,
            recipient,
            amount: BigInt(amount),
          },
        },
      });
      return result;
    } catch (err) {
      console.error('Transfer failed:', err);
      throw err;
    }
  }, [client, session, account, chainId]);

  const callContract = useCallback(async (contractAddress, contractName, functionName, functionArgs, postConditions = []) => {
    if (!client || !session || !account) {
      throw new Error('Not connected');
    }

    try {
      const result = await client.request({
        chainId,
        topic: session.topic,
        request: {
          method: 'stacks_contractCall',
          params: {
            pubkey: account,
            contractAddress,
            contractName,
            functionName,
            functionArgs,
            postConditions,
          },
        },
      });
      return result;
    } catch (err) {
      console.error('Contract call failed:', err);
      throw err;
    }
  }, [client, session, account, chainId]);

  const value = {
    client,
    session,
    account,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    signMessage,
    transferSTX,
    callContract,
    isConnected: !!session && !!account,
  };

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
    </WalletConnectContext.Provider>
  );
};
