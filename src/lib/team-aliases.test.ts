import { describe, it, expect } from "vitest";
import { normalizeTeamName } from "@/lib/team-aliases";

const CASES: [string, string][] = [
  // English passthrough
  ["Brazil", "brazil"],
  ["Argentina", "argentina"],
  ["Germany", "germany"],
  // Portuguese → English
  ["Brasil", "brazil"],
  ["Alemanha", "germany"],
  ["Espanha", "spain"],
  ["França", "france"],
  ["Países Baixos", "netherlands"],
  ["Coreia do Sul", "south korea"],
  // API variants
  ["Korea Republic", "south korea"],
  ["USA", "united states"],
  ["Cote d'Ivoire", "ivory coast"],
  ["IR Iran", "iran"],
  ["Czechia", "czech republic"],
  // Case-insensitive
  ["BRAZIL", "brazil"],
  ["brasil", "brazil"],
  // Accents removed before matching
  ["Bélgica", "belgium"],
  ["Suíça", "switzerland"],
  ["Japão", "japan"],
  // Unknown names → lowercased
  ["New Zealand", "new zealand"],
  ["Canada", "canada"],
];

describe("normalizeTeamName", () => {
  it.each(CASES)("normaliza '%s' → '%s'", (input, expected) => {
    expect(normalizeTeamName(input)).toBe(expected);
  });
});
