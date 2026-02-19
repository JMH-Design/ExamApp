"use client";

import { useParams } from "next/navigation";
import { getOnboardingData } from "@/lib/storage";
import { ProgressBar } from "@/components/onboarding/ProgressBar";
import { TextbookStep } from "@/components/onboarding/TextbookStep";

export default function TextbookIndexPage() {
  const params = useParams();
  const index = parseInt(String(params.index ?? "0"), 10);
  const courses = getOnboardingData()?.selectedCourses ?? [];

  return (
    <>
      <ProgressBar
        currentStep="textbooks"
        courseIndex={isNaN(index) ? 0 : index}
        totalCourses={courses.length}
      />
      <TextbookStep courseIndex={isNaN(index) ? 0 : index} />
    </>
  );
}
