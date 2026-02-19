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

export async function searchGoogleBooks(
  query: string,
  limit = 1
): Promise<GoogleBooksVolume | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const params = new URLSearchParams({
    q: query,
    maxResults: String(limit),
    printType: "books",
  });
  if (apiKey) params.set("key", apiKey);

  const res = await fetch(`${GOOGLE_BOOKS_URL}?${params}`);
  if (!res.ok) return null;

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

  const item = data.items?.[0];
  if (!item?.volumeInfo) return null;

  const vi = item.volumeInfo;
  return {
    title: vi.title ?? "",
    authors: vi.authors,
    publishedDate: vi.publishedDate,
    imageLinks: vi.imageLinks,
  };
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
