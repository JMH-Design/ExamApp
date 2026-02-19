import { NextRequest, NextResponse } from "next/server";
import { perplexityChat } from "@/lib/perplexity";
import { searchGoogleBooks, getCoverUrl } from "@/lib/google-books";

export type TextbookRecommendationResult = {
  title: string;
  authors: string;
  year?: string;
  coverUrl?: string;
};

export async function POST(request: NextRequest) {
  let body: { school?: string; program?: string; course?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
  const { school, program, course } = body;

  if (!school || !program) {
    return NextResponse.json(
      { error: "school and program are required" },
      { status: 400 }
    );
  }

  try {
    const prompt = course
      ? `Search the web for the top 5-10 most commonly used textbooks specifically for the course "${course}" in the "${program}" at "${school}". The textbooks must be relevant to the subject matter of this course (e.g., for "Advanced Pharmacology" return pharmacology textbooks; for "Pathophysiology" return pathophysiology textbooks). Return a JSON array of objects with title and authors (string, comma-separated). Example: [{"title":"Book Name","authors":"Author A, Author B"}]. Return only the JSON array.`
      : `Search for the top 5-10 most commonly used nursing textbooks for graduate nursing students at "${school}". Include textbooks used in DNP, MSN, and advanced practice nursing programs. Return a JSON array of objects with exactly these fields: title, authors (string, comma-separated). Example: [{"title":"Book Name","authors":"Author A, Author B"}]. Return only the JSON array, no other text.`;

    let raw = await perplexityChat(prompt, { jsonMode: true });

    const parseItems = (rawResponse: string): Array<{ title: string; authors: string }> => {
      let jsonStr = rawResponse.trim();
      const match = jsonStr.match(/\[[\s\S]*\]/);
      if (match) jsonStr = match[0];
      const parsed = JSON.parse(jsonStr) as Array<{ title: string; authors: string }>;
      return Array.isArray(parsed) ? parsed : [];
    };

    let items: Array<{ title: string; authors: string }>;
    try {
      items = parseItems(raw);
    } catch {
      return NextResponse.json({ textbooks: [] });
    }

    if (items.length === 0) {
      const fallbackPrompt = course
        ? `List 5-10 widely used textbooks for "${course}" in graduate nursing or advanced practice education in the US. Return a JSON array: [{"title":"Full Book Title","authors":"Author A, Author B"}]. Only the JSON array.`
        : `List 5-10 widely used nursing textbooks for graduate or advanced practice nursing education in the US. Include titles like pathophysiology, pharmacology, health assessment, or nursing theory. Return a JSON array: [{"title":"Full Book Title","authors":"Author A, Author B"}]. Only the JSON array.`;
      try {
        raw = await perplexityChat(fallbackPrompt, { jsonMode: true });
        items = parseItems(raw);
      } catch {
        // ignore fallback errors
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ textbooks: [] });
    }

    const limited = items.slice(0, 10);

    const textbooks: TextbookRecommendationResult[] = await Promise.all(
      limited.map(async (item) => {
        const query = `${item.title} ${item.authors}`.trim();
        const gb = await searchGoogleBooks(query, 1);
        return {
          title: item.title,
          authors: item.authors,
          year: gb?.publishedDate?.slice(0, 4) ?? undefined,
          coverUrl: gb ? getCoverUrl(gb) : undefined,
        };
      })
    );

    return NextResponse.json({ textbooks });
  } catch (err) {
    console.error("Textbook recommendations error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Recommendations failed" },
      { status: 500 }
    );
  }
}
