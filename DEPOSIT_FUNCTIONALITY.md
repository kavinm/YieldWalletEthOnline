# Deposit Functionality Implementation

This document describes the deposit functionality that has been implemented in the YieldWalletEthOnline project, based on the beefy-v2 deposit system.

## Overview

The deposit functionality allows users to deposit PYUSD tokens into a Beefy Finance vault on Ethereum mainnet. The implementation includes:

- **Deposit Form**: Interactive form for entering deposit amounts
- **Quick Actions**: One-click deposit all functionality
- **Transaction Stepper**: Multi-step transaction flow with progress tracking
- **Error Handling**: Comprehensive error handling and user feedback
- **Success States**: Clear success indicators and reset functionality

## Components

### 1. Hooks

#### `useDepositStepper.tsx`

Main hook that manages the deposit flow state and transaction execution:

- Manages transaction steps (approve → deposit)
- Handles transaction status updates
- Provides retry functionality
- Manages error states

#### `useDeposit.tsx`

Simpler hook for basic deposit functionality (legacy, can be removed if not needed).

### 2. Components

#### `DepositForm.tsx`

Interactive form component for deposit amounts:

- Amount input with validation
- Max button functionality
- Balance display
- Error and success state handling

#### `DepositActions.tsx`

Quick action component:

- One-click "Deposit All" functionality
- Status display
- Reset functionality

#### `DepositStepper.tsx`

Transaction progress component:

- Step-by-step progress visualization
- Retry functionality for failed steps
- Cancel transaction option
- Progress percentage display

### 3. UI Components

#### `progress.tsx`

Radix UI progress component for the stepper.

## Configuration

### Contract Addresses

- **PYUSD Token**: `0x6c3ea9036406852006290770BEdFcAbA0e23A0e8`
- **Beefy Vault**: `0xdA19C56DcDf4fB333acBE9aA18024DD2e4A864Bc`

### Network

- **Chain**: Ethereum Mainnet (Chain ID: 1)

## Transaction Flow

1. **User Input**: User enters deposit amount or clicks "Max"
2. **Approval Step**:
   - Contract approves PYUSD spending for the vault
   - Progress indicator shows approval status
3. **Deposit Step**:
   - Executes deposit transaction to the vault
   - Progress indicator shows deposit status
4. **Success**:
   - Success message displayed
   - Option to make another deposit

## Error Handling

The system handles various error scenarios:

- Insufficient balance
- Transaction failures
- Network errors
- User rejection of transactions

## Usage

### Basic Usage

```tsx
import DepositForm from "@/components/deposit/DepositForm";

function MyComponent() {
  return <DepositForm onSuccess={() => console.log("Deposit successful!")} />;
}
```

### With Stepper

```tsx
import { useDepositStepper } from "@/hooks/useDepositStepper";

function MyComponent() {
  const { startDepositFlow, steps, isProcessing } = useDepositStepper();

  const handleDeposit = () => {
    startDepositFlow("100.0"); // Deposit 100 PYUSD
  };

  return (
    <div>
      <button onClick={handleDeposit}>Deposit</button>
      {isProcessing && <DepositStepper steps={steps} />}
    </div>
  );
}
```

## Dependencies

The implementation uses the following key dependencies:

- **wagmi**: For blockchain interactions
- **viem**: For contract interactions and utilities
- **@radix-ui/react-progress**: For progress indicators
- **@rainbow-me/rainbowkit**: For wallet connection

## Security Considerations

- All transactions require explicit user approval
- Input validation prevents invalid amounts
- Error handling prevents failed transactions from being processed
- Contract addresses are hardcoded to prevent address spoofing

## Future Enhancements

Potential improvements for the deposit functionality:

1. **Slippage Protection**: Add slippage tolerance settings
2. **Gas Optimization**: Implement gas estimation and optimization
3. **Multi-token Support**: Extend to support multiple token types
4. **Batch Transactions**: Support for multiple deposits in one transaction
5. **Advanced Analytics**: Add transaction history and analytics
6. **Mobile Optimization**: Improve mobile user experience

## Testing

To test the deposit functionality:

1. Start the development server: `pnpm dev`
2. Connect a wallet with PYUSD tokens
3. Navigate to the deposit page
4. Try different deposit amounts
5. Test the "Max" functionality
6. Test error scenarios (insufficient balance, etc.)

## Troubleshooting

### Common Issues

1. **"Insufficient Balance" Error**

   - Ensure wallet has enough PYUSD tokens
   - Check that the correct network (Ethereum) is selected

2. **Transaction Fails**

   - Check network connection
   - Ensure sufficient ETH for gas fees
   - Verify contract addresses are correct

3. **Approval Issues**
   - Clear browser cache and try again
   - Check if previous approval is still pending

### Debug Mode

Enable debug logging by adding console.log statements in the hooks to track transaction flow and identify issues.
