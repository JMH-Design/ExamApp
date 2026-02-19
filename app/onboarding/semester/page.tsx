import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { SemesterStep } from "@/components/onboarding/SemesterStep";

export default function SemesterPage() {
  return (
    <>
      <ProgressBar currentStep="semester" />
      <SemesterStep />
    </>
  );
}
