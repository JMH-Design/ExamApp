import { NextRequest, NextResponse } from "next/server";
import { perplexityChat } from "@/lib/perplexity";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, authors } = body as { title?: string; authors?: string };

    if (!title || !authors) {
      return NextResponse.json(
        { error: "title and authors are required" },
        { status: 400 }
      );
    }

    const prompt = `Find the table of contents or chapter list for the textbook "${title}" by ${authors}. Return ONLY a JSON array of chapter and subchapter names as strings. Return only topics you find in search results. If you cannot find specific, verifiable chapter information, return an empty array []. Do not infer or invent any topics. Example: ["Chapter 1: Introduction","1.1 Overview","1.2 Key Concepts"]`;

    const raw = await perplexityChat(prompt, { jsonMode: true });

    let jsonStr = raw.trim();
    const match = jsonStr.match(/\[[\s\S]*\]/);
    if (match) jsonStr = match[0];

    let topics: string[];
    try {
      topics = JSON.parse(jsonStr) as string[];
    } catch {
      return NextResponse.json({ topics: [] });
    }

    if (!Array.isArray(topics)) {
      return NextResponse.json({ topics: [] });
    }

    return NextResponse.json({ topics });
  } catch (err) {
    console.error("Topics fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Topics fetch failed" },
      { status: 500 }
    );
  }
}
