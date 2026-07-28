const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overallMatchScore: { type: "integer", minimum: 0, maximum: 100 },
    recruiterFirstImpression: { type: "string" },
    topStrengths: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
    topGaps: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
    atsScore: { type: "integer", minimum: 0, maximum: 100 },
    careerDNA: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
    nextActions: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
  },
  required: [
    "overallMatchScore",
    "recruiterFirstImpression",
    "topStrengths",
    "topGaps",
    "atsScore",
    "careerDNA",
    "nextActions",
  ],
};

function response(statusCode, body) {
  return { statusCode, headers: jsonHeaders, body: JSON.stringify(body) };
}

function normalizeText(value, maxLength) {
  return typeof value === "string" ? value.replace(/\u0000/g, "").trim().slice(0, maxLength) : "";
}

function isAnalysis(value) {
  const arrayKeys = ["topStrengths", "topGaps", "careerDNA", "nextActions"];
  return value && typeof value === "object"
    && Number.isInteger(value.overallMatchScore)
    && value.overallMatchScore >= 0 && value.overallMatchScore <= 100
    && Number.isInteger(value.atsScore) && value.atsScore >= 0 && value.atsScore <= 100
    && typeof value.recruiterFirstImpression === "string"
    && arrayKeys.every((key) => Array.isArray(value[key]) && value[key].every((item) => typeof item === "string"))
    && value.nextActions.length === 3;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { ...jsonHeaders, Allow: "POST" }, body: JSON.stringify({ error: "Method not allowed." }) };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not configured.");
    return response(503, { error: "Analysis is temporarily unavailable." });
  }

  let input;
  try {
    input = JSON.parse(event.body || "{}");
  } catch {
    return response(400, { error: "The request body must be valid JSON." });
  }

  const resume = normalizeText(input.resume, 50_000);
  const jobDescription = normalizeText(input.jobDescription, 35_000);
  if (resume.length < 200 || jobDescription.length < 120) {
    return response(400, { error: "Please provide a fuller resume and job description." });
  }

  const system = `You are Threadline: a senior recruiter, hiring manager, ATS expert, resume strategist, and career-transition expert.

NON-NEGOTIABLE TRUTH POLICY:
- Use only facts explicitly supported by the resume text.
- Never invent, infer as fact, embellish, or assume qualifications, tools, experience, education, certifications, metrics, titles, dates, or accomplishments.
- Treat the job description only as requirements, never as evidence about the candidate.
- When resume evidence is absent, name it as a gap. Do not recommend claiming it.
- Recommendations may improve structure, emphasis, and wording only when the underlying claim is already supported.
- Do not penalize the candidate for protected characteristics or speculate about them.
- Scores are directional assessments, not hiring guarantees.

Judge relevance, strength of evidence, required versus preferred qualifications, keyword alignment, readability, and recruiter scan order. Be direct, useful, and compassionate. Each strength must be traceable to resume evidence. Each action must preserve factual accuracy. Return only JSON matching the supplied schema.`;

  try {
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
        max_tokens: 1800,
        temperature: 0.1,
        system,
        messages: [{
          role: "user",
          content: `Compare these documents.\n\n<resume>\n${resume}\n</resume>\n\n<job_description>\n${jobDescription}\n</job_description>`,
        }],
        output_config: {
          format: {
            type: "json_schema",
            schema,
          },
        },
      }),
    });

    const result = await anthropicResponse.json();
    if (!anthropicResponse.ok) {
      console.error("Anthropic request failed:", anthropicResponse.status, result?.error?.type);
      return response(502, { error: "The analysis service could not complete this request. Please try again." });
    }
    const text = result.content?.find((block) => block.type === "text")?.text;
    const analysis = JSON.parse(text || "{}");
    if (!isAnalysis(analysis)) throw new Error("Invalid analysis shape");
    return response(200, analysis);
  } catch (error) {
    console.error("Job-fit analysis failed:", error instanceof Error ? error.message : "Unknown error");
    return response(502, { error: "The analysis service returned an unexpected response. Please try again." });
  }
}
