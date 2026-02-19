"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useRef,
} from "react";

export type TextbookResult = {
  title: string;
  authors: string;
  year?: string;
  coverUrl?: string;
};

export type DirectSearchFilters = {
  subject?: string;
  yearMin?: number;
  yearMax?: number;
  author?: string;
  edition?: string;
};

type SearchStatus = "idle" | "loading" | "success" | "error";
type RecommendationsStatus = "idle" | "loading" | "success" | "error";

type OnboardingContextValue = {
  textbooks: TextbookResult[];
  searchStatus: SearchStatus;
  searchError: string | null;
  triggerDirectSearch: (
    query: string,
    filters?: DirectSearchFilters,
    page?: number
  ) => void;
  aiRecommendations: TextbookResult[];
  recommendationsStatus: RecommendationsStatus;
  recommendationsError: string | null;
  triggerRecommendations: (school: string, program: string, course?: string) => void;
  clearRecommendations: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [textbooks, setTextbooks] = useState<TextbookResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<TextbookResult[]>([]);
  const [recommendationsStatus, setRecommendationsStatus] =
    useState<RecommendationsStatus>("idle");
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const recsAbortRef = useRef<AbortController | null>(null);

  const triggerDirectSearch = useCallback(
    (query: string, filters: DirectSearchFilters = {}, page = 1) => {
      searchAbortRef.current?.abort();
      searchAbortRef.current = new AbortController();
      const signal = searchAbortRef.current.signal;

      setSearchStatus("loading");
      setTextbooks([]);
      setSearchError(null);

      fetch("/api/textbooks/search-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          ...filters,
          page,
          limit: 24,
        }),
        signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? `Request failed: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (signal.aborted) return;
          setTextbooks(data.textbooks ?? []);
          setSearchStatus("success");
          setSearchError(null);
        })
        .catch((err) => {
          if (signal.aborted || err.name === "AbortError") return;
          setSearchStatus("error");
          setSearchError(err.message ?? "Search failed");
          setTextbooks([]);
        });
    },
    []
  );

  const triggerRecommendations = useCallback(
    (school: string, program: string, course?: string) => {
      recsAbortRef.current?.abort();
      recsAbortRef.current = new AbortController();
      const signal = recsAbortRef.current.signal;

      setRecommendationsStatus("loading");
      setAiRecommendations([]);
      setRecommendationsError(null);

      fetch("/api/textbooks/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ school, program, course }),
        signal,
      })
        .then(async (res) => {
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error ?? `Request failed: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (signal.aborted) return;
          setAiRecommendations(data.textbooks ?? []);
          setRecommendationsStatus("success");
          setRecommendationsError(null);
        })
        .catch((err) => {
          if (signal.aborted || err.name === "AbortError") return;
          setRecommendationsStatus("error");
          setRecommendationsError(err.message ?? "Recommendations failed");
          setAiRecommendations([]);
        });
    },
    []
  );

  const clearRecommendations = useCallback(() => {
    recsAbortRef.current?.abort();
    setRecommendationsStatus("idle");
    setAiRecommendations([]);
    setRecommendationsError(null);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        textbooks,
        searchStatus,
        searchError,
        triggerDirectSearch,
        aiRecommendations,
        recommendationsStatus,
        recommendationsError,
        triggerRecommendations,
        clearRecommendations,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
