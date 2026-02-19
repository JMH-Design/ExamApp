"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import programsData from "@/data/programs.json";
import { getOnboardingData, setOnboardingData } from "@/lib/storage";

const programs = programsData as Array<{
  id: string;
  name: string;
  schoolId: string;
}>;

export function ProgramStep() {
  const router = useRouter();
  const onboarding = getOnboardingData();
  const schoolId = onboarding?.schoolId;

  const [query, setQuery] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && !schoolId) {
      router.replace("/onboarding/school");
    }
  }, [schoolId, router]);

  const filtered = useMemo(() => {
    let list = schoolId
      ? programs.filter((p) => p.schoolId === schoolId)
      : programs;
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }, [query, schoolId]);

  const handleSelect = (program: { id: string; name: string }) => {
    setOnboardingData({ programId: program.id, programName: program.name });
    router.push("/onboarding/semester");
  };

  if (!schoolId) {
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
        What program are you a part of?
      </h1>
      <p className="text-foreground/70 font-body mb-12 max-w-md text-center">
        Select your graduate nursing program
      </p>

      <div className="w-full max-w-lg">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs..."
            className="w-full pl-12 pr-4 py-4 rounded-lg bg-foreground/10 border border-foreground/20 text-foreground placeholder:text-foreground/50 font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        <ul className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {filtered.map((program) => (
            <li key={program.id}>
              <button
                type="button"
                onClick={() => handleSelect(program)}
                className="w-full text-left px-4 py-3 rounded-lg bg-foreground/5 hover:bg-foreground/10 border border-transparent hover:border-primary/30 transition-all font-body text-foreground"
              >
                {program.name}
              </button>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="mt-4 text-foreground/60 font-body text-center">
            No programs match your search
          </p>
        )}
      </div>
    </div>
  );
}
