import Parallel from "parallel-web";

const parallelApiKey = process.env.PARALLEL_API_KEY;

export interface ParallelSearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface RawParallelResultItem {
  title?: string;
  url?: string;
  link?: string;
  snippet?: string;
  content?: string;
  text?: string;
  [key: string]: unknown;
}

interface RawParallelResponse {
  results?: RawParallelResultItem[];
  data?: RawParallelResultItem[];
  [key: string]: unknown;
}

export async function executeParallelResearch(
  objective: string
): Promise<ParallelSearchResult[]> {
  if (!parallelApiKey) {
    throw new Error("PARALLEL_API_KEY is not defined in environment variables.");
  }

  try {
    const client = new Parallel({ apiKey: parallelApiKey });

    // Call Parallel Web Search API
    const response = (await client.taskRun.create({
      input: objective,
      processor: "lite", // or "base" / "fast" depending on budget & latency needs
    })) as unknown as RawParallelResponse;

    // Fallback/standardized normalization
    if (response && Array.isArray(response.results)) {
      return response.results.map((res: RawParallelResultItem) => ({
        title: res.title || "External Source",
        url: res.url || res.link || "#",
        snippet: res.snippet || res.content || res.text || "",
      }));
    }

    return [
      {
        title: "Parallel Search Result",
        url: "https://parallel.ai",
        snippet:
          typeof response === "string"
            ? response
            : JSON.stringify(response),
      },
    ];
  } catch (error) {
    console.error("Parallel Research API Error, executing REST fallback:", error);

    // Fallback direct REST API execution
    const res = await fetch("https://api.parallel.ai/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": parallelApiKey,
      },
      body: JSON.stringify({ objective }),
    });

    if (!res.ok) {
      throw new Error(`Parallel REST API execution failed with status ${res.status}`);
    }

    const data = (await res.json()) as RawParallelResponse;
    const results = data.results || data.data || [];

    return results.map((item: RawParallelResultItem) => ({
      title: item.title || "External Intelligence Source",
      url: item.url || "#",
      snippet: item.snippet || item.text || "",
    }));
  }
}