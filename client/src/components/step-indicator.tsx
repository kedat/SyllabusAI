import { useEffect, useState } from "react";

interface StepProps {
  currentStep: number;
  steps: string[];
}

export default function StepIndicator({ currentStep, steps }: StepProps) {
  const [progressWidths, setProgressWidths] = useState<string[]>(
    Array(steps.length - 1).fill("0%")
  );

  useEffect(() => {
    const newProgressWidths = [...progressWidths];
    
    for (let i = 0; i < steps.length - 1; i++) {
      if (i < currentStep) {
        newProgressWidths[i] = "100%";
      } else if (i === currentStep) {
        newProgressWidths[i] = "50%"; // Current connector is 50% filled
      } else {
        newProgressWidths[i] = "0%";
      }
    }
    
    setProgressWidths(newProgressWidths);
  }, [currentStep, steps.length]);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        <div className="step-container flex items-center w-full max-w-3xl justify-between">
          {steps.map((label, index) => (
            <div key={index}>
              {/* Step circle and label */}
              <div className="step flex flex-col items-center" data-active={index <= currentStep}>
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium
                    ${index <= currentStep 
                      ? "bg-primary text-white" 
                      : "bg-gray-200 text-gray-600"}`}
                >
                  {index + 1}
                </div>
                <span 
                  className={`text-sm font-medium mt-2
                    ${index <= currentStep 
                      ? "text-gray-900" 
                      : "text-gray-500"}`}
                >
                  {label}
                </span>
              </div>

              {/* Connector (except after the last step) */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-1 bg-gray-200 mx-2 step-progress">
                  <div 
                    className="progress-bar relative w-full"
                  >
                    <div 
                      className="progress-bar-fill"
                      style={{ width: progressWidths[index] }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
