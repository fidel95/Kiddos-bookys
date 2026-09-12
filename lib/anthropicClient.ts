// Server-only: this file reads ANTHROPIC_API_KEY and must never be imported from client components.
import Anthropic from "@anthropic-ai/sdk";

// Claude Opus 5 gives the best storytelling/translation quality; swap to "claude-sonnet-5"
// here if you'd rather trade some quality for lower per-story cost.
export const STORY_MODEL_ID = "claude-opus-5";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}
