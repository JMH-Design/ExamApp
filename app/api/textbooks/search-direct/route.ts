import { NextRequest, NextResponse } from "next/server";
import {
  searchGoogleBooksFull,
  getCoverUrl,
  type GoogleBooksSearchFilters,
} from "@/lib/google-books";
import { searchOpenLibrary } from "@/lib/open-library";

export type TextbookSearchResult = {
  title: string;
  authors: string;
  year?: string;
  coverUrl?: string;
  source: "google" | "openlibrary";
};

function normalizeKey(title: string, authors: string): string {
  return `${title.toLowerCase().trim()}|${authors.toLowerCase().trim()}`;
}

export async function POST(request: NextRequest) {
  let body: {
    query?: string;
    subject?: string;
    yearMin?: number;
    yearMax?: number;
    author?: string;
    edition?: string;
    page?: number;
    limit?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const {
    query = "",
    subject,
    yearMin,
    yearMax,
    author,
    edition,
    page = 1,
    limit = 20,
  } = body;

  const filters: GoogleBooksSearchFilters = {};
  if (subject) filters.subject = subject;
  if (yearMin) filters.yearMin = yearMin;
  if (yearMax) filters.yearMax = yearMax;
  if (author) filters.author = author;
  if (edition) filters.edition = edition;

  const offset = (page - 1) * limit;
  const perSource = Math.ceil(limit / 2);

  try {
    const [gbVolumes, olResults] = await Promise.all([
      searchGoogleBooksFull(query.trim() || "textbook", {
        limit: perSource,
        offset,
        filters,
      }),
      searchOpenLibrary(query.trim() || "textbook", {
        limit: perSource,
        page,
        author,
        edition,
      }),
    ]);

    const seen = new Set<string>();
    const textbooks: TextbookSearchResult[] = [];

    const addFromGoogle = (v: { title: string; authors?: string[]; publishedDate?: string; imageLinks?: unknown }) => {
      const authorsStr = (v.authors ?? []).join(", ");
      const key = normalizeKey(v.title, authorsStr);
      if (seen.has(key)) return;
      seen.add(key);
      const year = v.publishedDate?.slice(0, 4);
      if (yearMin && year && parseInt(year, 10) < yearMin) return;
      if (yearMax && year && parseInt(year, 10) > yearMax) return;
      textbooks.push({
        title: v.title,
        authors: authorsStr,
        year,
        coverUrl: getCoverUrl(v as Parameters<typeof getCoverUrl>[0]),
        source: "google",
      });
    };

    const addFromOL = (r: { title: string; authors: string; year?: string; coverUrl?: string }) => {
      const key = normalizeKey(r.title, r.authors);
      if (seen.has(key)) return;
      seen.add(key);
      if (yearMin && r.year && parseInt(r.year, 10) < yearMin) return;
      if (yearMax && r.year && parseInt(r.year, 10) > yearMax) return;
      textbooks.push({
        ...r,
        source: "openlibrary",
      });
    };

    gbVolumes.forEach(addFromGoogle);
    olResults.forEach(addFromOL);

    return NextResponse.json({
      textbooks: textbooks.slice(0, limit),
      hasMore: textbooks.length >= limit,
    });
  } catch (err) {
    console.error("Direct textbook search error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
