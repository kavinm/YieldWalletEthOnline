"use client";

import { Button } from "@/components/ui/button";

interface ShowYieldStrategyButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const ShowYieldStrategyButton = ({
  onClick,
  disabled = false,
  className,
}: ShowYieldStrategyButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={className}
      size="lg"
      variant="outline"
    >
      Show Yield Strategy
    </Button>
  );
};

export default ShowYieldStrategyButton;
