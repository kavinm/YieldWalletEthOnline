'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createEIP712AuthMessageSigner,
  parseRPCResponse,
  RPCMethod,
} from '@erc7824/nitrolite';

// --- PLACEHOLDER: Replace with your server-side operator wallet ---
const OPERATOR_PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
// --- END OF PLACEHOLDER ---

const CLEARNODE_URL = 'wss://clearnet.yellow.com/ws';

interface HotWalletContextType {
  isAuthenticated: boolean;
  operatorAddress: string;
  sendMessage: (message: string) => void;
}

const HotWalletContext = createContext<HotWalletContextType | null>(null);

export const useHotWallet = () => {
  const context = useContext(HotWalletContext);
  if (!context) {
    throw new Error('useHotWallet must be used within a HotWalletProvider');
  }
  return context;
};

export const HotWalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY);

  useEffect(() => {
    const socket = new WebSocket(CLEARNODE_URL);
    setWs(socket);

    socket.onopen = () => {
      console.log('Hot Wallet connected to ClearNode.');
      authenticate(socket);
    };

    socket.onmessage = (event) => {
      handleMessage(event.data, socket);
    };

    socket.onclose = () => {
      console.log('Hot Wallet disconnected from ClearNode.');
      setIsAuthenticated(false);
    };

    socket.onerror = (error) => {
      console.error('Hot Wallet WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, []);

  const authenticate = async (socket: WebSocket) => {
    const authRequest = {
      address: operatorWallet.address,
      session_key: operatorWallet.address,
      app_name: 'YieldNexusHotWallet',
      expire: (Math.floor(Date.now() / 1000) + 3600).toString(),
      scope: 'operator',
      application: '0x0000000000000000000000000000000000000000',
      allowances: [],
    };
    const authRequestMsg = await createAuthRequestMessage(authRequest);
    socket.send(authRequestMsg);
  };

  const handleMessage = async (data: string, socket: WebSocket) => {
    const message = parseRPCResponse(data);

    switch (message.method) {
      case RPCMethod.AuthChallenge:
        console.log('Hot Wallet received auth challenge.');
        const eip712MessageSigner = createEIP712AuthMessageSigner(
          operatorWallet,
          {
            scope: 'operator',
            application: '0x0000000000000000000000000000000000000000',
            participant: operatorWallet.address,
            expire: (Math.floor(Date.now() / 1000) + 3600).toString(),
            allowances: [],
          },
          { name: 'YieldNexusHotWallet' },
        );
        const authVerifyMsg = await createAuthVerifyMessage(
          eip712MessageSigner,
          message,
        );
        socket.send(authVerifyMsg);
        break;

      case RPCMethod.AuthVerify:
        if (message.params.success) {
          setIsAuthenticated(true);
          console.log('Hot Wallet authenticated successfully.');
        } else {
          console.error('Hot Wallet authentication failed.');
        }
        break;

      case RPCMethod.Error:
        console.error('Hot Wallet received error:', message.params.error);
        break;
    }
  };

  const sendMessage = (message: string) => {
    ws?.send(message);
  }

  const value = {
    isAuthenticated,
    operatorAddress: operatorWallet.address,
    sendMessage,
  };

  return (
    <HotWalletContext.Provider value={value}>
      {children}
    </HotWalletContext.Provider>
  );
};
