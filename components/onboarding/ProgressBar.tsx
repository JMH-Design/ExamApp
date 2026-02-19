"use client";

import * as Progress from "@radix-ui/react-progress";

const STEPS = ["school", "program", "semester", "courses", "textbooks"];
const STEP_LABELS: Record<string, string> = {
  school: "School",
  program: "Program",
  semester: "Semester",
  courses: "Courses",
  textbooks: "Textbook",
};

type ProgressBarProps = {
  currentStep: string;
  courseIndex?: number;
  totalCourses?: number;
};

export function ProgressBar({
  currentStep,
  courseIndex = 0,
  totalCourses = 1,
}: ProgressBarProps) {
  const idx = STEPS.indexOf(currentStep);
  const isTextbooks = currentStep === "textbooks";
  const stepLabel = isTextbooks
    ? `Textbook (Course ${courseIndex + 1} of ${totalCourses})`
    : STEP_LABELS[currentStep] ?? currentStep;
  const progress = idx >= 0 ? ((idx + 1) / STEPS.length) * 100 : 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur px-6 py-4">
      <div className="max-w-2xl mx-auto">
        <Progress.Root
          value={progress}
          className="h-1.5 w-full overflow-hidden rounded-full bg-foreground/20"
        >
          <Progress.Indicator
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </Progress.Root>
        <p className="mt-2 text-sm text-foreground/70 font-body">
          Step {idx + 1} of {STEPS.length}: {stepLabel}
        </p>
      </div>
    </div>
  );
}
