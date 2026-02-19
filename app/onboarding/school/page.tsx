import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { SchoolStep } from "@/components/onboarding/SchoolStep";

export default function SchoolPage() {
  return (
    <>
      <ProgressBar currentStep="school" />
      <SchoolStep />
    </>
  );
}
