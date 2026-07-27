import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ParsedRecipeSchema, KNOWN_UNITS, CATEGORIES, type ParsedRecipe } from "./schema";

/**
 * The LLM boundary — server-side by nature (uses ANTHROPIC_API_KEY + the Node
 * SDK). Parses free recipe text into validated structured ingredients, and for
 * each either a catalog match or the product knowledge to create a new one.
 * It never does maths or invents densities.
 */
export class ParseError extends Error {}

const SYSTEM = `You convert a pasted UK recipe into structured data. Rules:
- Units MUST be one of: ${KNOWN_UNITS.join(", ")}. Convert others: "2 cloves" -> 2 each, "a pinch" -> a small tsp amount, fractions -> decimals.
- For each ingredient give a lowercase, singular, brand-free canonicalName.
- You are given a catalog of known ingredients (id + name). If an ingredient clearly IS one of them, set matchedIngredientId to that id; otherwise null.
- category MUST be one of: ${CATEGORIES.join(", ")}.
- For the pack, give a typical UK supermarket pack (packSize, packUnit, packLabel), e.g. chopped tomatoes -> 400 g "tin chopped tomatoes". Best-effort; these may be corrected later.
- Do NOT provide densities or do any arithmetic.`;

export async function parseRecipe(
  text: string,
  catalog: { id: string; canonicalName: string }[],
): Promise<ParsedRecipe> {
  const client = new Anthropic(); // lazy: reads ANTHROPIC_API_KEY when called
  const user = `Catalog:\n${JSON.stringify(catalog)}\n\nRecipe:\n${text}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.parse({
        model: "claude-sonnet-5",
        max_tokens: 8192,
        system: SYSTEM,
        messages: [{ role: "user", content: user }],
        output_config: { format: zodOutputFormat(ParsedRecipeSchema) },
      });
      if (response.parsed_output) return response.parsed_output;
    } catch {
      // fall through and retry once
    }
  }
  throw new ParseError("Could not parse the recipe after one retry.");
}
