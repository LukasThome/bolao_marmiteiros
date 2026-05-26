// Canonical form: lowercase English name without accents
// Maps any known variant → canonical so both DB names and API names normalize to the same key

const ALIASES: Record<string, string> = {
  // Portuguese → English
  "brasil":              "brazil",
  "alemanha":            "germany",
  "espanha":             "spain",
  "franca":              "france",
  "inglaterra":          "england",
  "paises baixos":       "netherlands",
  "holanda":             "netherlands",
  "belgica":             "belgium",
  "suica":               "switzerland",
  "suecia":              "sweden",
  "noruega":             "norway",
  "dinamarca":           "denmark",
  "austria":             "austria",
  "escocia":             "scotland",
  "gales":               "wales",
  "irlanda":             "ireland",
  "romenia":             "romania",
  "republica tcheca":    "czech republic",
  "servia":              "serbia",
  "croacia":             "croatia",
  "eslovenia":           "slovenia",
  "eslovaquia":          "slovakia",
  "albania":             "albania",
  "turquia":             "turkey",
  "georgia":             "georgia",
  "japao":               "japan",
  "coreia do sul":       "south korea",
  "coreia do norte":     "north korea",
  "china":               "china",
  "australia":           "australia",
  "iran":                "iran",
  "iraque":              "iraq",
  "arabia saudita":      "saudi arabia",
  "emirados arabes":     "united arab emirates",
  "estados unidos":      "united states",
  "mexico":              "mexico",
  "canada":              "canada",
  "costa rica":          "costa rica",
  "panama":              "panama",
  "jamaica":             "jamaica",
  "honduras":            "honduras",
  "nigeria":             "nigeria",
  "marrocos":            "morocco",
  "senegal":             "senegal",
  "africa do sul":       "south africa",
  "costa do marfim":     "ivory coast",
  "camaroes":            "cameroon",
  "ghana":               "ghana",
  "tunisia":             "tunisia",
  "mali":                "mali",
  "egito":               "egypt",
  "bolivia":             "bolivia",
  "colombia":            "colombia",
  "chile":               "chile",
  "equador":             "ecuador",
  "paraguai":            "paraguay",
  "peru":                "peru",
  "uruguai":             "uruguay",
  "venezuela":           "venezuela",
  "argentina":           "argentina",

  // API variant names → canonical
  "korea republic":      "south korea",
  "republic of korea":   "south korea",
  "korea dpr":           "north korea",
  "ir iran":             "iran",
  "usa":                 "united states",
  "eua":                 "united states",
  "uae":                 "united arab emirates",
  "china pr":            "china",
  "cote d'ivoire":       "ivory coast",
  "cote divoire":        "ivory coast",
  "czechia":             "czech republic",
  "czech republic":      "czech republic",
  "republic of ireland": "ireland",
  "trinidad and tobago": "trinidad tobago",
  "trinidad tobago":     "trinidad tobago",
  "new zealand":         "new zealand",
  "new caledonia":       "new caledonia",
  "nova zelandia":       "new zealand",
};

export function normalizeTeamName(name: string): string {
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();

  return ALIASES[normalized] ?? normalized;
}
