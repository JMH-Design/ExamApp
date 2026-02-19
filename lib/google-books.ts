const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes";

export type GoogleBooksVolume = {
  title: string;
  authors?: string[];
  publishedDate?: string;
  imageLinks?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
  };
};

export type GoogleBooksSearchFilters = {
  subject?: string;
  yearMin?: number;
  yearMax?: number;
  author?: string;
  edition?: string;
};

export async function searchGoogleBooks(
  query: string,
  limit = 1
): Promise<GoogleBooksVolume | null> {
  const results = await searchGoogleBooksFull(query, { limit });
  return results[0] ?? null;
}

export async function searchGoogleBooksFull(
  query: string,
  options: {
    limit?: number;
    offset?: number;
    filters?: GoogleBooksSearchFilters;
  } = {}
): Promise<GoogleBooksVolume[]> {
  const { limit = 20, offset = 0, filters = {} } = options;
  const parts: string[] = [query.trim()];

  if (filters.subject) parts.push(`subject:${filters.subject}`);
  if (filters.author) parts.push(`inauthor:${filters.author}`);
  if (filters.edition) parts.push(filters.edition);
  if (filters.yearMin) parts.push(`${filters.yearMin}`);
  if (filters.yearMax && !filters.yearMin) parts.push(`${filters.yearMax}`);

  const q = parts.filter(Boolean).join(" ");
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const params = new URLSearchParams({
    q: q || "textbook",
    maxResults: String(Math.min(limit, 40)),
    startIndex: String(offset),
    printType: "books",
    orderBy: "relevance",
  });
  if (apiKey) params.set("key", apiKey);

  const res = await fetch(`${GOOGLE_BOOKS_URL}?${params}`);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    items?: Array<{
      volumeInfo?: {
        title?: string;
        authors?: string[];
        publishedDate?: string;
        imageLinks?: { thumbnail?: string; small?: string; medium?: string };
      };
    }>;
  };

  const items = data.items ?? [];
  const mapped: GoogleBooksVolume[] = [];
  for (const item of items) {
    const vi = item.volumeInfo;
    if (!vi?.title) continue;
    mapped.push({
      title: vi.title,
      authors: vi.authors,
      publishedDate: vi.publishedDate,
      imageLinks: vi.imageLinks,
    });
  }
  let volumes = mapped;

  if (filters.yearMin || filters.yearMax) {
    volumes = volumes.filter((v) => {
      const year = v.publishedDate ? parseInt(v.publishedDate.slice(0, 4), 10) : NaN;
      if (isNaN(year)) return true;
      if (filters.yearMin && year < filters.yearMin) return false;
      if (filters.yearMax && year > filters.yearMax) return false;
      return true;
    });
  }

  return volumes;
}

export function getCoverUrl(volume: GoogleBooksVolume): string | undefined {
  const url =
    volume.imageLinks?.medium ??
    volume.imageLinks?.small ??
    volume.imageLinks?.thumbnail;
  if (url && url.startsWith("http:")) {
    return url.replace("http:", "https:");
  }
  return url;
}
