const OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json";

export type OpenLibraryDoc = {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  edition_count?: number;
};

export type OpenLibrarySearchResult = {
  title: string;
  authors: string;
  year?: string;
  coverUrl?: string;
};

const USER_AGENT = "ExamApp/1.0 (https://github.com/exam-app; contact@example.com)";

export async function searchOpenLibrary(
  query: string,
  options: {
    limit?: number;
    page?: number;
    author?: string;
    edition?: string;
  } = {}
): Promise<OpenLibrarySearchResult[]> {
  const { limit = 20, page = 1, author, edition } = options;

  let q = query.trim() || "textbook";
  if (edition) q = `${q} ${edition}`.trim();

  const params = new URLSearchParams();
  if (author) {
    params.set("author", author);
    params.set("q", q);
  } else {
    params.set("q", q);
  }
  params.set("limit", String(Math.min(limit, 50)));
  params.set("page", String(page));
  params.set("fields", "title,author_name,first_publish_year,cover_i");

  const res = await fetch(`${OPEN_LIBRARY_SEARCH_URL}?${params}`, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as { docs?: OpenLibraryDoc[] };
  const docs = data.docs ?? [];

  return docs
    .filter((d) => d.title)
    .map((d) => ({
      title: d.title!,
      authors: (d.author_name ?? []).join(", "),
      year: d.first_publish_year ? String(d.first_publish_year) : undefined,
      coverUrl: d.cover_i
        ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
        : undefined,
    }));
}
