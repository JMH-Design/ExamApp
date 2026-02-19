import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { ProgramStep } from "@/components/onboarding/ProgramStep";

export default function ProgramPage() {
  return (
    <>
      <ProgressBar currentStep="program" />
      <ProgramStep />
    </>
  );
}
