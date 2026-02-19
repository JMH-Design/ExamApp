"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { getOnboardingData, updateCourseSelection } from "@/lib/storage";
import { useOnboarding } from "@/context/OnboardingContext";
import type { TextbookResult } from "@/context/OnboardingContext";

type TextbookStepProps = {
  courseIndex: number;
};

export function TextbookStep({ courseIndex }: TextbookStepProps) {
  const router = useRouter();
  const onboarding = getOnboardingData();
  const {
    textbookSearchStatus,
    textbooks,
    textbookSearchError,
    triggerTextbookSearch,
  } = useOnboarding();
  const [selecting, setSelecting] = useState<string | null>(null);

  const courses = onboarding?.selectedCourses ?? [];
  const course = courses[courseIndex];
  const totalCourses = courses.length;
  const nextIndex = courseIndex + 1;
  const isLastCourse = nextIndex >= totalCourses;

  useEffect(() => {
    if (courseIndex < 0 || courseIndex >= totalCourses) {
      router.replace("/home");
      return;
    }
  }, [courseIndex, totalCourses, router]);

  useEffect(() => {
    if (
      onboarding?.schoolName &&
      onboarding?.programName &&
      course?.name
    ) {
      triggerTextbookSearch(
        onboarding.schoolName,
        onboarding.programName,
        course.name
      );
    }
  }, [onboarding?.schoolName, onboarding?.programName, course?.name, triggerTextbookSearch]);

  useEffect(() => {
    if (!course && (courseIndex >= totalCourses || totalCourses === 0)) {
      router.replace("/home");
    }
  }, [course, courseIndex, totalCourses, router]);

  const goToNext = () => {
    if (isLastCourse) {
      router.push("/home");
    } else {
      router.push(`/onboarding/textbooks/${nextIndex}`);
    }
  };

  const handleSkip = () => {
    updateCourseSelection(courseIndex, { skipped: true });
    goToNext();
  };

  const handleSelect = async (textbook: TextbookResult) => {
    setSelecting(textbook.title);
    updateCourseSelection(courseIndex, {
      textbook: {
        title: textbook.title,
        authors: textbook.authors,
        year: textbook.year,
        coverUrl: textbook.coverUrl,
      },
    });

    try {
      const res = await fetch("/api/textbooks/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: textbook.title,
          authors: textbook.authors,
        }),
      });
      const data = await res.json();
      const topics = Array.isArray(data.topics) ? data.topics : [];
      updateCourseSelection(courseIndex, { topics });
    } catch {
      updateCourseSelection(courseIndex, { topics: [] });
    } finally {
      setSelecting(null);
      goToNext();
    }
  };

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (!onboarding?.schoolId || !onboarding?.programId || !onboarding?.semester)
    ) {
      router.replace("/onboarding/school");
    }
  }, [onboarding?.schoolId, onboarding?.programId, onboarding?.semester, router]);

  if (!onboarding?.schoolId || !onboarding?.programId || !onboarding?.semester) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-foreground/70 font-body">
          Loading…
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-foreground/70 font-body">
          Loading…
        </div>
      </div>
    );
  }

  if (textbookSearchStatus === "loading" || textbookSearchStatus === "idle") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-24">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
        <h2 className="font-heading text-2xl text-foreground mb-2">
          Finding textbooks for {course.name}
        </h2>
        <p className="text-foreground/70 font-body text-center max-w-md">
          Searching course syllabi and bookstores…
        </p>
      </div>
    );
  }

  if (textbookSearchStatus === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-24">
        <h2 className="font-heading text-2xl text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-foreground/70 font-body mb-6 text-center max-w-md">
          {textbookSearchError}
        </p>
        <button
          type="button"
          onClick={() =>
            triggerTextbookSearch(
              onboarding.schoolName!,
              onboarding.programName!,
              course.name
            )
          }
          className="px-6 py-3 rounded-lg bg-primary text-[#252525] font-body font-semibold hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-8 py-24 pt-32">
      <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-2 text-center">
        Textbook for {course.name}
      </h1>
      <p className="text-foreground/70 font-body mb-12 max-w-md text-center">
        Select your textbook or skip this course
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        {textbooks.map((textbook) => (
          <button
            key={`${textbook.title}-${textbook.authors}`}
            type="button"
            onClick={() => handleSelect(textbook)}
            disabled={selecting !== null}
            className="flex flex-col rounded-xl overflow-hidden bg-foreground/5 border border-foreground/20 hover:border-primary/50 transition-all text-left group disabled:opacity-50"
          >
            <div className="aspect-[3/4] bg-foreground/10 relative">
              {textbook.coverUrl ? (
                <Image
                  src={textbook.coverUrl}
                  alt={textbook.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-foreground/30 font-body text-sm">
                    No cover
                  </span>
                </div>
              )}
            </div>
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-body font-semibold text-foreground line-clamp-2 mb-1">
                {textbook.title}
              </h3>
              <p className="text-foreground/70 font-body text-sm line-clamp-1 mb-1">
                {textbook.authors}
              </p>
              {textbook.year && (
                <p className="text-foreground/50 font-body text-sm">
                  {textbook.year}
                </p>
              )}
              <span className="mt-auto pt-3 text-primary font-body font-medium group-hover:underline">
                {selecting === textbook.title ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading…
                  </span>
                ) : (
                  "Select"
                )}
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSkip}
        className="mt-8 px-6 py-3 rounded-lg border border-foreground/30 text-foreground/80 font-body hover:bg-foreground/10 transition-colors"
      >
        Skip this course
      </button>
    </div>
  );
}
