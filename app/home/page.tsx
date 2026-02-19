"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getOnboardingData, hasCompletedOnboarding } from "@/lib/storage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (!hasCompletedOnboarding()) {
      router.replace("/onboarding/school");
    }
  }, [router]);

  const data = typeof window !== "undefined" ? getOnboardingData() : null;

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-foreground/70 font-body">
          Loading…
        </div>
      </div>
    );
  }

  const courses = data.selectedCourses ?? [];
  const hasLegacyTextbook = !!data.textbook;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-24">
      <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-4">
        Welcome
      </h1>
      <p className="text-foreground/70 font-body mb-8 max-w-md text-center">
        You&apos;re all set. Practice exams for your courses will be available
        here soon.
      </p>

      <div className="w-full max-w-md rounded-xl bg-foreground/5 border border-foreground/20 p-6 font-body">
        <h2 className="font-heading text-xl text-foreground mb-4">
          Your setup
        </h2>
        <dl className="space-y-2 text-sm">
          <div>
            <dt className="text-foreground/60">School</dt>
            <dd className="text-foreground">{data.schoolName}</dd>
          </div>
          <div>
            <dt className="text-foreground/60">Program</dt>
            <dd className="text-foreground">{data.programName}</dd>
          </div>
          <div>
            <dt className="text-foreground/60">Semester</dt>
            <dd className="text-foreground capitalize">{data.semester}</dd>
          </div>
          {hasLegacyTextbook && (
            <>
              <div>
                <dt className="text-foreground/60">Textbook</dt>
                <dd className="text-foreground">{data.textbook!.title}</dd>
              </div>
              {data.topics && data.topics.length > 0 && (
                <div>
                  <dt className="text-foreground/60">Topics loaded</dt>
                  <dd className="text-foreground">{data.topics.length} chapters</dd>
                </div>
              )}
            </>
          )}
          {courses.length > 0 && (
            <div>
              <dt className="text-foreground/60">Courses</dt>
              <dd className="text-foreground mt-2 space-y-1">
                {courses.map((c) => (
                  <div key={c.id} className="pl-2 border-l-2 border-primary/30">
                    <span className="font-medium">{c.name}</span>
                    {c.skipped ? (
                      <span className="text-foreground/60"> — Skipped</span>
                    ) : c.textbook ? (
                      <span className="text-foreground/60">
                        {" "}
                        — {c.textbook.title}
                      </span>
                    ) : null}
                  </div>
                ))}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
