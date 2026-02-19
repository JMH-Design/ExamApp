"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getOnboardingData, setOnboardingData } from "@/lib/storage";
import type { CourseSelection } from "@/lib/storage";

type CourseOption = { id: string; name: string };

export function CoursesStep() {
  const router = useRouter();
  const onboarding = getOnboardingData();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (!onboarding?.schoolId ||
        !onboarding?.programId ||
        !onboarding?.semester)
    ) {
      router.replace("/onboarding/school");
      return;
    }
  }, [onboarding?.schoolId, onboarding?.programId, onboarding?.semester, router]);

  useEffect(() => {
    if (
      !onboarding?.schoolName ||
      !onboarding?.programName ||
      !onboarding?.semester
    )
      return;

    setLoading(true);
    setError(null);
    fetch("/api/courses/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school: onboarding.schoolName,
        program: onboarding.programName,
        semester: onboarding.semester,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Request failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const list = (data.courses ?? []) as CourseOption[];
        setCourses(list);
        if (list.length === 0) {
          setOnboardingData({
            selectedCourses: [],
            completedWithoutCourses: true,
          });
          router.replace("/home");
        }
      })
      .catch((err) => {
        setError(err.message ?? "Search failed");
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, [
    onboarding?.schoolName,
    onboarding?.programName,
    onboarding?.semester,
    router,
  ]);

  const toggleCourse = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleContinue = () => {
    const selectedCourses: CourseSelection[] = courses
      .filter((c) => selected.has(c.id))
      .map((c) => ({ id: c.id, name: c.name }));
    setOnboardingData({ selectedCourses });
    if (selectedCourses.length > 0) {
      router.push("/onboarding/textbooks/0");
    }
  };

  if (!onboarding?.schoolId || !onboarding?.programId || !onboarding?.semester) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-foreground/70 font-body">
          Loading…
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-24">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-6" />
        <h2 className="font-heading text-2xl text-foreground mb-2">
          Finding courses
        </h2>
        <p className="text-foreground/70 font-body text-center max-w-md">
          Searching for courses offered this semester…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 py-24">
        <h2 className="font-heading text-2xl text-foreground mb-2">
          Something went wrong
        </h2>
        <p className="text-foreground/70 font-body mb-6 text-center max-w-md">
          {error}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-3 rounded-lg bg-primary text-[#252525] font-body font-semibold hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  const canContinue = selected.size > 0;

  return (
    <div className="min-h-screen flex flex-col items-center px-8 py-24 pt-32">
      <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-2 text-center">
        Which courses are you taking?
      </h1>
      <p className="text-foreground/70 font-body mb-12 max-w-md text-center">
        Select all courses you&apos;re enrolled in this semester
      </p>

      <div className="w-full max-w-lg space-y-3 max-h-96 overflow-y-auto">
        {courses.map((course) => (
          <label
            key={course.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-foreground/5 border border-foreground/20 hover:border-primary/30 cursor-pointer transition-all"
          >
            <input
              type="checkbox"
              checked={selected.has(course.id)}
              onChange={() => toggleCourse(course.id)}
              className="w-5 h-5 rounded border-foreground/30 bg-foreground/10 text-primary focus:ring-primary"
            />
            <span className="font-body text-foreground">{course.name}</span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue}
        className="mt-12 w-full max-w-lg py-4 rounded-lg bg-primary text-[#252525] font-body font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        Continue
      </button>
    </div>
  );
}
