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

type TextbookSearchStatus = "idle" | "loading" | "success" | "error";

type OnboardingContextValue = {
  textbookSearchStatus: TextbookSearchStatus;
  textbooks: TextbookResult[];
  textbookSearchError: string | null;
  triggerTextbookSearch: (school: string, program: string, course?: string) => void;
  clearTextbookSearch: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<TextbookSearchStatus>("idle");
  const [textbooks, setTextbooks] = useState<TextbookResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const triggerTextbookSearch = useCallback(
    (school: string, program: string, course?: string) => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const signal = abortRef.current.signal;

      setStatus("loading");
      setTextbooks([]);
      setError(null);

      fetch("/api/textbooks/search", {
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
          setTextbooks(data.textbooks ?? []);
          setStatus("success");
          setError(null);
        })
        .catch((err) => {
          if (signal.aborted || err.name === "AbortError") return;
          setStatus("error");
          setError(err.message ?? "Search failed");
          setTextbooks([]);
        });
    },
    []
  );

  const clearTextbookSearch = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
    setTextbooks([]);
    setError(null);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        textbookSearchStatus: status,
        textbooks,
        textbookSearchError: error,
        triggerTextbookSearch,
        clearTextbookSearch,
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
