import {
  createAuthRequestMessage,
  createAuthVerifyMessage,
  createEIP712AuthMessageSigner,
  parseRPCResponse,
  RPCMethod,
  createAppSessionMessage,
  createCloseAppSessionMessage,
} from '@erc7824/nitrolite';
import { ethers } from 'ethers';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

// --- PLACEHOLDER: Replace with your server-side operator wallet ---
const OPERATOR_PRIVATE_KEY = '0x0123456789012345678901234567890123456789012345678901234567890123';
// --- END OF PLACEHOLDER ---

const CLEARNODE_URL = 'wss://clearnet.yellow.com/ws';

class HotWalletService extends EventEmitter {
  private ws: WebSocket | null = null;
  private isAuthenticated = false;
  private operatorWallet: ethers.Wallet;

  constructor() {
    super();
    this.operatorWallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY);
  }

  public connect() {
    this.ws = new WebSocket(CLEARNODE_URL);

    this.ws.on('open', () => {
      console.log('Hot Wallet connected to ClearNode.');
      this.authenticate();
    });

    this.ws.on('message', (data: string) => {
      this.handleMessage(data);
    });

    this.ws.on('close', () => {
      console.log('Hot Wallet disconnected from ClearNode.');
      this.isAuthenticated = false;
      this.emit('disconnected');
    });

    this.ws.on('error', (error) => {
      console.error('Hot Wallet WebSocket error:', error);
    });
  }

  private async authenticate() {
    if (!this.ws) return;

    const authRequest = {
        address: this.operatorWallet.address,
        session_key: this.operatorWallet.address, // Using same for simplicity
        app_name: 'YieldNexusHotWallet',
        expire: (Math.floor(Date.now() / 1000) + 3600).toString(),
        scope: 'operator',
        application: '0x0000000000000000000000000000000000000000', // Or your app address
        allowances: [],
    };

    const authRequestMsg = await createAuthRequestMessage(authRequest);
    this.ws.send(authRequestMsg);
  }

  private async handleMessage(data: string) {
    const message = parseRPCResponse(data);

    switch (message.method) {
      case RPCMethod.AuthChallenge:
        console.log('Hot Wallet received auth challenge.');
        
        const eip712MessageSigner = createEIP712AuthMessageSigner(
          this.operatorWallet,
          {
            scope: 'operator',
            application: '0x0000000000000000000000000000000000000000',
            participant: this.operatorWallet.address,
            expire: (Math.floor(Date.now() / 1000) + 3600).toString(),
            allowances: [],
          },
          { name: 'YieldNexusHotWallet' },
        );

        const authVerifyMsg = await createAuthVerifyMessage(
          eip712MessageSigner,
          message
        );
        this.ws?.send(authVerifyMsg);
        break;

      case RPCMethod.AuthVerify:
        if (message.params.success) {
          this.isAuthenticated = true;
          console.log('Hot Wallet authenticated successfully.');
          this.emit('authenticated');
        } else {
          console.error('Hot Wallet authentication failed.');
        }
        break;
      
      // Handle other messages like app session creation responses
      case RPCMethod.CreateAppSession:
        this.emit('app_session_created', message.params);
        break;

      case RPCMethod.Error:
        console.error('Hot Wallet received error:', message.params.error);
        break;
    }
  }

  public async createAppSession(userAddress: string, amount: string) {
    if (!this.isAuthenticated || !this.ws) {
      throw new Error("Hot wallet is not authenticated.");
    }
    // ... logic to create app session message ...
    // This part will need the user's signature, so it should be constructed on the client-side
    // and this service would co-sign or just be a participant.
    // For this simulation, we'll assume the client creates and signs the message.
    console.log(`Simulating app session creation with user ${userAddress} for ${amount} PYUSD.`);
    
    // In a real scenario, the hot wallet would then trigger the on-chain deposit
    this.triggerOnChainDeposit(userAddress, amount);
  }
  
  private triggerOnChainDeposit(userAddress: string, amount: string) {
    console.log(`[HOT WALLET] Received ${amount} PYUSD off-chain from ${userAddress}.`);
    console.log(`[HOT WALLET] Now executing on-chain bridgeAndExecute to move funds to yield vault...`);
    // Here you would use the Avail Nexus SDK on the backend
    // For now, we just log it.
  }

  public send(message: string) {
    this.ws?.send(message);
  }
}

export const hotWalletService = new HotWalletService();
