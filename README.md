## Project Overview

### Step 1: Reading Balances (Avail Nexus)

What it does: When you connect your wallet, the frontend uses the Avail Nexus SDK's getUnifiedBalance('PYUSD') function.
Why it's used: This is Avail Nexus's strength. It queries multiple blockchains (Ethereum, Solana, etc.) and presents a single, aggregated balance to the user. This gives the user a simple, unified view of their assets without needing to switch networks.

### Step 2: The "Instant" Deposit (Nitrolite State Channels)

What it does: When you click "Deposit & Earn (Instant)", you are not performing an on-chain transaction. Instead, you are using the Nitrolite SDK to create an off-chain application session with our simulated Hot Wallet.
How it works:
Your browser signs a message (createAppSessionMessage) that says, "I am allocating X amount of PYUSD to the Hot Wallet."
This message is sent to the public ClearNode.
The Hot Wallet (also connected to the ClearNode) receives this message.
Why it's used: This entire process is just a few messages passed over a WebSocket. It's instantaneous from your perspective. The UI can immediately show "Deposit successful!" because the funds are now committed to the hot wallet within the off-chain state channel.

### Step 3: The Background On-Chain Execution (Avail Nexus)

What it does: Now that the Hot Wallet has control of your PYUSD in the state channel, it needs to actually move funds into the on-chain yield vault.
How it works:
Our simulated HotWalletProvider logs a message saying it's starting the on-chain work.
In a real backend, the operator would now use the Avail Nexus SDK's bridgeAndExecute function.
Why it's used: This is the other superpower of Avail Nexus. The operator doesn't need to worry about where its own liquidity is. It can just tell Nexus, "Take 100 PYUSD from wherever I have it, bridge it to Ethereum Mainnet, and call the deposit function on this Yearn Vault contract." Nexus handles all the complex routing and bridging automatically.

## Resources

#### PYUSD Token Contracts

| Chain            | Address                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Ethereum Mainnet | [0x6c3ea9036406852006290770BEdFcAbA0e23A0e8](https://etherscan.io/address/0x6c3ea9036406852006290770bedfcaba0e23a0e8)        |
| Ethereum Sepolia | [0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9](https://sepolia.etherscan.io/token/0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9)  |
| Arbitrum Mainnet | [0x46850aD61C2B7d64d08c9C754F45254596696984](https://arbiscan.io/address/0x46850ad61c2b7d64d08c9c754f45254596696984)         |
| Arbitrum Sepolia | [0x637A1259C6afd7E3AdF63993cA7E58BB438aB1B1](https://sepolia.arbiscan.io/address/0x637a1259c6afd7e3adf63993ca7e58bb438ab1b1) |

More resources can be found [here](https://linktr.ee/pyusd_dev).
