"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { getOnboardingData, setOnboardingData } from "@/lib/storage";

const SEMESTERS = [
  { value: "fall", label: "Fall" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" },
];

function getCurrentSemester(): string {
  const month = new Date().getMonth();
  if (month >= 8) return "fall";
  if (month >= 5) return "summer";
  return "spring";
}

export function SemesterStep() {
  const router = useRouter();
  const onboarding = getOnboardingData();
  const [semester, setSemester] = useState(getCurrentSemester);

  const handleContinue = () => {
    setOnboardingData({ semester });
    router.push("/onboarding/courses");
  };

  useEffect(() => {
    if (typeof window !== "undefined" && (!onboarding?.schoolId || !onboarding?.programId)) {
      router.replace("/onboarding/school");
    }
  }, [onboarding?.schoolId, onboarding?.programId, router]);

  if (!onboarding?.schoolId || !onboarding?.programId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-foreground/70 font-body">
          Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-24">
      <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-2">
        What semester are you studying for?
      </h1>
      <p className="text-foreground/70 font-body mb-12 max-w-md text-center">
        Choose the semester you&apos;re studying for
      </p>

      <div className="w-full max-w-md space-y-6">
        <Select.Root value={semester} onValueChange={setSemester}>
          <Select.Trigger
            className="flex w-full items-center justify-between gap-2 px-4 py-4 rounded-lg bg-foreground/10 border border-foreground/20 text-foreground font-body focus:outline-none focus:ring-2 focus:ring-primary data-[placeholder]:text-foreground/50"
            aria-label="Select semester"
          >
            <Select.Value placeholder="Choose semester" />
            <Select.Icon>
              <ChevronDown className="w-5 h-5 text-foreground/70" />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content
              className="overflow-hidden rounded-lg bg-[#1e2e2a] border border-foreground/20 shadow-xl z-50"
              position="popper"
              sideOffset={4}
            >
              {SEMESTERS.map((s) => (
                <Select.Item
                  key={s.value}
                  value={s.value}
                  className="flex items-center px-4 py-3 text-foreground font-body cursor-pointer outline-none hover:bg-primary/20 focus:bg-primary/20 data-[highlighted]:bg-primary/20"
                >
                  <Select.ItemText>{s.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Portal>
        </Select.Root>

        <button
          type="button"
          onClick={handleContinue}
          className="w-full py-4 rounded-lg bg-primary text-[#252525] font-body font-semibold hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
