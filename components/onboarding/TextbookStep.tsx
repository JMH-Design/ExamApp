"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Search, ChevronDown, ChevronUp } from "lucide-react";
import { getOnboardingData, updateCourseSelection } from "@/lib/storage";
import { useOnboarding } from "@/context/OnboardingContext";
import type { TextbookResult } from "@/context/OnboardingContext";

const SUBJECT_OPTIONS = [
  { value: "", label: "Any subject" },
  { value: "Medical", label: "Medical" },
  { value: "Nursing", label: "Nursing" },
  { value: "Pharmacology", label: "Pharmacology" },
  { value: "Pathophysiology", label: "Pathophysiology" },
  { value: "Health", label: "Health" },
  { value: "Education", label: "Education" },
];

type TextbookStepProps = {
  courseIndex: number;
};

function TextbookCard({
  textbook,
  selecting,
  onSelect,
}: {
  textbook: TextbookResult;
  selecting: string | null;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
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
            <span className="text-foreground/30 font-body text-sm">No cover</span>
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
          <p className="text-foreground/50 font-body text-sm">{textbook.year}</p>
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
  );
}

export function TextbookStep({ courseIndex }: TextbookStepProps) {
  const router = useRouter();
  const onboarding = getOnboardingData();
  const {
    textbooks,
    searchStatus,
    searchError,
    triggerDirectSearch,
    aiRecommendations,
    recommendationsStatus,
    recommendationsError,
    triggerRecommendations,
    clearRecommendations,
  } = useOnboarding();

  const [selecting, setSelecting] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({
    subject: "",
    yearMin: "",
    yearMax: "",
    author: "",
    edition: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showAiSection, setShowAiSection] = useState(false);

  const courses = onboarding?.selectedCourses ?? [];
  const course = courses[courseIndex];
  const totalCourses = courses.length;
  const nextIndex = courseIndex + 1;
  const isLastCourse = nextIndex >= totalCourses;

  const runSearch = useCallback(() => {
    const f = {
      subject: filters.subject || undefined,
      yearMin: filters.yearMin ? parseInt(filters.yearMin, 10) : undefined,
      yearMax: filters.yearMax ? parseInt(filters.yearMax, 10) : undefined,
      author: filters.author || undefined,
      edition: filters.edition || undefined,
    };
    triggerDirectSearch((query.trim() || course?.name) ?? "", f);
  }, [query, filters, course?.name, triggerDirectSearch]);

  useEffect(() => {
    if (courseIndex < 0 || courseIndex >= totalCourses) {
      router.replace("/home");
      return;
    }
  }, [courseIndex, totalCourses, router]);

  useEffect(() => {
    if (course?.name && onboarding?.schoolName && onboarding?.programName) {
      setQuery(course.name);
      const f = {
        subject: filters.subject || undefined,
        yearMin: filters.yearMin ? parseInt(filters.yearMin, 10) : undefined,
        yearMax: filters.yearMax ? parseInt(filters.yearMax, 10) : undefined,
        author: filters.author || undefined,
        edition: filters.edition || undefined,
      };
      triggerDirectSearch(course.name, f);
    }
  }, [course?.name, onboarding?.schoolName, onboarding?.programName]);

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

  const handleGetAiSuggestions = () => {
    setShowAiSection(true);
    if (
      onboarding?.schoolName &&
      onboarding?.programName &&
      recommendationsStatus === "idle"
    ) {
      triggerRecommendations(
        onboarding.schoolName,
        onboarding.programName,
        course?.name
      );
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
        <div className="animate-pulse text-foreground/70 font-body">Loading…</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-foreground/70 font-body">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 sm:px-8 py-24 pt-32">
      <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-2 text-center">
        Textbook for {course.name}
      </h1>
      <p className="text-foreground/70 font-body mb-8 max-w-md text-center">
        Search for your textbook or skip this course
      </p>

      <div className="w-full max-w-2xl mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Search by title, author, or keyword…"
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-foreground/5 border border-foreground/20 text-foreground font-body placeholder:text-foreground/40 focus:outline-none focus:border-primary/50"
            />
          </div>
          <button
            type="button"
            onClick={runSearch}
            disabled={searchStatus === "loading"}
            className="px-6 py-3 rounded-lg bg-primary text-[#252525] font-body font-semibold hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {searchStatus === "loading" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Search"
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="mt-3 flex items-center gap-2 text-foreground/70 font-body text-sm hover:text-foreground transition-colors"
        >
          {showFilters ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          {showFilters ? "Hide filters" : "Show filters"}
        </button>

        {showFilters && (
          <div className="mt-4 p-4 rounded-lg bg-foreground/5 border border-foreground/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-foreground/70 font-body text-sm mb-1">
                Subject
              </label>
              <select
                value={filters.subject}
                onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
                className="w-full px-3 py-2 rounded bg-foreground/5 border border-foreground/20 text-foreground font-body"
              >
                {SUBJECT_OPTIONS.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-foreground/70 font-body text-sm mb-1">
                Author
              </label>
              <input
                type="text"
                value={filters.author}
                onChange={(e) => setFilters((f) => ({ ...f, author: e.target.value }))}
                placeholder="Author name"
                className="w-full px-3 py-2 rounded bg-foreground/5 border border-foreground/20 text-foreground font-body placeholder:text-foreground/40"
              />
            </div>
            <div>
              <label className="block text-foreground/70 font-body text-sm mb-1">
                Year (min)
              </label>
              <input
                type="number"
                value={filters.yearMin}
                onChange={(e) => setFilters((f) => ({ ...f, yearMin: e.target.value }))}
                placeholder="e.g. 2015"
                min={1900}
                max={2030}
                className="w-full px-3 py-2 rounded bg-foreground/5 border border-foreground/20 text-foreground font-body placeholder:text-foreground/40"
              />
            </div>
            <div>
              <label className="block text-foreground/70 font-body text-sm mb-1">
                Year (max)
              </label>
              <input
                type="number"
                value={filters.yearMax}
                onChange={(e) => setFilters((f) => ({ ...f, yearMax: e.target.value }))}
                placeholder="e.g. 2024"
                min={1900}
                max={2030}
                className="w-full px-3 py-2 rounded bg-foreground/5 border border-foreground/20 text-foreground font-body placeholder:text-foreground/40"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-foreground/70 font-body text-sm mb-1">
                Edition
              </label>
              <input
                type="text"
                value={filters.edition}
                onChange={(e) => setFilters((f) => ({ ...f, edition: e.target.value }))}
                placeholder="e.g. 10th edition"
                className="w-full px-3 py-2 rounded bg-foreground/5 border border-foreground/20 text-foreground font-body placeholder:text-foreground/40"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={runSearch}
                disabled={searchStatus === "loading"}
                className="px-4 py-2 rounded-lg bg-primary/20 text-primary font-body font-medium hover:bg-primary/30 transition-colors disabled:opacity-70"
              >
                Apply filters
              </button>
            </div>
          </div>
        )}
      </div>

      {searchStatus === "loading" && textbooks.length === 0 && (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-foreground/70 font-body">Searching Google Books & Open Library…</p>
        </div>
      )}

      {searchStatus === "error" && textbooks.length === 0 && (
        <div className="flex flex-col items-center py-8">
          <p className="text-foreground/70 font-body mb-4 text-center">{searchError}</p>
          <button
            type="button"
            onClick={runSearch}
            className="px-6 py-3 rounded-lg bg-primary text-[#252525] font-body font-semibold hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {textbooks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
          {textbooks.map((textbook) => (
            <TextbookCard
              key={`${textbook.title}-${textbook.authors}`}
              textbook={textbook}
              selecting={selecting}
              onSelect={() => handleSelect(textbook)}
            />
          ))}
        </div>
      )}

      {searchStatus === "success" && textbooks.length === 0 && query && (
        <p className="text-foreground/60 font-body mb-6">No results found. Try different search terms or filters.</p>
      )}

      {!showAiSection ? (
        <button
          type="button"
          onClick={handleGetAiSuggestions}
          className="text-primary font-body text-sm hover:underline"
        >
          Not finding your book? Get AI suggestions
        </button>
      ) : (
        <div className="w-full max-w-4xl mt-6 p-6 rounded-xl border border-foreground/20 bg-foreground/5">
          <p className="text-amber-400/90 font-body text-sm mb-4 font-medium">
            AI suggestions – verify before selecting
          </p>
          {recommendationsStatus === "loading" && aiRecommendations.length === 0 && (
            <div className="flex items-center gap-2 py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-foreground/70 font-body">Fetching AI suggestions…</span>
            </div>
          )}
          {recommendationsStatus === "error" && aiRecommendations.length === 0 && (
            <div className="py-4">
              <p className="text-foreground/70 font-body mb-2">{recommendationsError}</p>
              <button
                type="button"
                onClick={() =>
                  triggerRecommendations(
                    onboarding!.schoolName!,
                    onboarding!.programName!,
                    course?.name
                  )
                }
                className="text-primary font-body text-sm hover:underline"
              >
                Try again
              </button>
            </div>
          )}
          {aiRecommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiRecommendations.map((textbook) => (
                <TextbookCard
                  key={`ai-${textbook.title}-${textbook.authors}`}
                  textbook={textbook}
                  selecting={selecting}
                  onSelect={() => handleSelect(textbook)}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setShowAiSection(false);
              clearRecommendations();
            }}
            className="mt-4 text-foreground/60 font-body text-sm hover:text-foreground"
          >
            Hide AI suggestions
          </button>
        </div>
      )}

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
