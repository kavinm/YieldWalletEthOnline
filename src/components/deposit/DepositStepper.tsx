"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description: string;
  status: "pending" | "loading" | "completed" | "error";
  error?: string;
}

interface DepositStepperProps {
  steps: Step[];
  currentStep: number;
  onRetry?: (stepId: string) => void;
  onCancel?: () => void;
}

export default function DepositStepper({
  steps,
  currentStep,
  onRetry,
  onCancel,
}: DepositStepperProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const completedSteps = steps.filter(
      (step) => step.status === "completed"
    ).length;
    const progressPercentage = (completedSteps / steps.length) * 100;
    setProgress(progressPercentage);
  }, [steps]);

  const getStepIcon = (step: Step, index: number) => {
    if (step.status === "completed") {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    if (
      step.status === "loading" ||
      (index === currentStep && step.status === "pending")
    ) {
      return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    }
    if (step.status === "error") {
      return <Circle className="h-5 w-5 text-red-600" />;
    }
    return <Circle className="h-5 w-5 text-gray-400" />;
  };

  const getStepStatusColor = (step: Step) => {
    switch (step.status) {
      case "completed":
        return "text-green-600";
      case "loading":
        return "text-blue-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Transaction Progress</CardTitle>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getStepIcon(step, index)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-medium ${getStepStatusColor(
                      step
                    )}`}
                  >
                    {step.title}
                  </h4>
                  {step.status === "error" && onRetry && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRetry(step.id)}
                      className="text-xs"
                    >
                      Retry
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
                {step.error && (
                  <p className="text-sm text-red-600 mt-1">{step.error}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cancel Button */}
        {currentStep < steps.length && (
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full"
            disabled={steps.some((step) => step.status === "loading")}
          >
            Cancel Transaction
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
