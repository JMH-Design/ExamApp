"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import schoolsData from "@/data/schools.json";
import { setOnboardingData } from "@/lib/storage";

const schools = schoolsData as Array<{ id: string; name: string }>;

export function SchoolStep() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(
    null
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return schools;
    const q = query.toLowerCase();
    return schools.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [query]);

  const handleSelect = (school: { id: string; name: string }) => {
    setSelected(school);
    setOnboardingData({ schoolId: school.id, schoolName: school.name });
    router.push("/onboarding/program");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-24">
      <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-2">
        What university do you attend?
      </h1>
      <p className="text-foreground/70 font-body mb-12 max-w-md text-center">
        Search for your school to get started
      </p>

      <div className="w-full max-w-lg">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search schools..."
            className="w-full pl-12 pr-4 py-4 rounded-lg bg-foreground/10 border border-foreground/20 text-foreground placeholder:text-foreground/50 font-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            autoFocus
          />
        </div>

        <ul className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {filtered.map((school) => (
            <li key={school.id}>
              <button
                type="button"
                onClick={() => handleSelect(school)}
                className="w-full text-left px-4 py-3 rounded-lg bg-foreground/5 hover:bg-foreground/10 border border-transparent hover:border-primary/30 transition-all font-body text-foreground"
              >
                {school.name}
              </button>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="mt-4 text-foreground/60 font-body text-center">
            No schools match your search
          </p>
        )}
      </div>
    </div>
  );
}
