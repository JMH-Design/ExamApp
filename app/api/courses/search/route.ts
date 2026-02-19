import { NextRequest, NextResponse } from "next/server";
import { perplexityChat } from "@/lib/perplexity";

export type CourseSearchResult = {
  id: string;
  name: string;
};

export async function POST(request: NextRequest) {
  let body: { school?: string; program?: string; semester?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
  const { school, program, semester } = body;

  if (!school || !program || !semester) {
    return NextResponse.json(
      { error: "school, program, and semester are required" },
      { status: 400 }
    );
  }

  try {
    const prompt = `What courses are typically offered in the "${program}" at "${school}" during ${semester} semester? Many programs only offer certain courses during certain semesters. Return a JSON array of objects with id (short slug like "pathophysiology") and name (full course name). Only include courses typically offered this semester. Example: [{"id":"pathophysiology","name":"Advanced Pathophysiology"}]. Return only the JSON array.`;

    const raw = await perplexityChat(prompt, { jsonMode: true });

    const parseItems = (rawResponse: string): CourseSearchResult[] => {
      let jsonStr = rawResponse.trim();
      const match = jsonStr.match(/\[[\s\S]*\]/);
      if (match) jsonStr = match[0];
      const parsed = JSON.parse(jsonStr) as Array<{ id?: string; name?: string }>;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((c) => c?.id && c?.name)
        .map((c) => ({
          id: String(c.id).trim().toLowerCase().replace(/\s+/g, "-"),
          name: String(c.name).trim(),
        }));
    };

    let courses: CourseSearchResult[];
    try {
      courses = parseItems(raw);
    } catch {
      return NextResponse.json({ courses: [] });
    }

    if (courses.length === 0) {
      const fallbackPrompt = `List 5-10 common graduate nursing courses that might be offered in a "${program}" program at a US university. Return JSON array: [{"id":"slug","name":"Course Name"}]. Only the JSON array.`;
      try {
        const fallbackRaw = await perplexityChat(fallbackPrompt, { jsonMode: true });
        courses = parseItems(fallbackRaw);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ courses });
  } catch (err) {
    console.error("Courses search error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 }
    );
  }
}
