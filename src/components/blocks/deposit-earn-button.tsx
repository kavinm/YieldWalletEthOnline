"use client";

import { Button } from "@/components/ui/button";

interface DepositEarnButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const DepositEarnButton = ({
  onClick,
  disabled = false,
  className,
}: DepositEarnButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={className}
      size="lg"
    >
      Deposit & Earn
    </Button>
  );
};

export default DepositEarnButton;
