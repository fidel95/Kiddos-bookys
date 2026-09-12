import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { getAnthropicClient, STORY_MODEL_ID } from "@/lib/anthropicClient";
import { GeneratedStorySchema, buildSystemPrompt, buildUserPrompt } from "@/lib/storyPrompt";
import type { AgeRange, Page } from "@/types/story";

const RequestSchema = z.object({
  childName: z.string().trim().max(30).optional(),
  theme: z.string().trim().min(1).max(80),
  ageRange: z.enum(["3-5", "6-8", "9-12"]),
});

function friendlyError(message: string, status: number) {
  return NextResponse.json({ friendly: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return friendlyError("Oops, that didn't work. Let's try again!", 400);
  }

  const parsedInput = RequestSchema.safeParse(body);
  if (!parsedInput.success) {
    return friendlyError("Please fill in a name and a story idea first.", 400);
  }

  const { childName, theme, ageRange } = parsedInput.data;
  const client = getAnthropicClient();

  try {
    const response = await client.messages.parse({
      model: STORY_MODEL_ID,
      max_tokens: 4096,
      system: buildSystemPrompt(ageRange as AgeRange),
      messages: [{ role: "user", content: buildUserPrompt({ childName, theme, ageRange: ageRange as AgeRange }) }],
      output_config: {
        effort: "medium",
        format: zodOutputFormat(GeneratedStorySchema),
      },
    });

    if (response.stop_reason === "refusal") {
      return friendlyError("Let's try a different story idea!", 422);
    }

    if (!response.parsed_output) {
      return friendlyError("The story got a little jumbled. Please try again!", 502);
    }

    const generated = response.parsed_output;
    const pages: Page[] = generated.pages.map((page, index) => ({
      pageNumber: index + 1,
      sentences: page.sentences,
      sceneTags: page.sceneTags,
    }));

    return NextResponse.json({
      title: generated.title,
      childName,
      theme,
      ageRange,
      pages,
    });
  } catch (error) {
    console.error("generate-story failed:", error);
    if (error instanceof Anthropic.RateLimitError) {
      return friendlyError("Lots of storybooks are being made right now! Please try again in a minute.", 429);
    }
    if (error instanceof Anthropic.APIError) {
      return friendlyError("Our storyteller is taking a nap. Please try again soon!", 502);
    }
    return friendlyError("Something went wrong making your story. Please try again!", 500);
  }
}
