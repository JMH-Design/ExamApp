import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { CoursesStep } from "@/components/onboarding/CoursesStep";

export default function CoursesPage() {
  return (
    <>
      <ProgressBar currentStep="courses" />
      <CoursesStep />
    </>
  );
}
