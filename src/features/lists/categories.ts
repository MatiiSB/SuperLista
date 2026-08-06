/**
 * Product categories — pure config and categorization logic (no DB).
 *
 * The category list is fixed in code. `autoCategorize` does keyword matching
 * (Spanish, locale es). `resolveCategory` layers a learned mapping (from the
 * product_categories table) on top, and exposes a `barcode` seam for future
 * Open Food Facts integration (unused today).
 */

export interface Category {
  slug: string;
  label: string;
  emoji: string;
}

/** Ordered list of categories. "otros" is always last and acts as fallback. */
export const CATEGORIES: Category[] = [
  { slug: "lacteos", label: "Lácteos", emoji: "🥛" },
  { slug: "carnes", label: "Carnes", emoji: "🥩" },
  { slug: "verduleria", label: "Verdulería", emoji: "🥬" },
  { slug: "bebidas", label: "Bebidas", emoji: "🥤" },
  { slug: "panaderia", label: "Panadería", emoji: "🍞" },
  { slug: "almacen", label: "Almacén", emoji: "🥫" },
  { slug: "limpieza", label: "Limpieza", emoji: "🧽" },
  { slug: "higiene", label: "Higiene", emoji: "🧴" },
  { slug: "congelados", label: "Congelados", emoji: "❄️" },
  { slug: "snacks", label: "Snacks", emoji: "🍪" },
  { slug: "mascotas", label: "Mascotas", emoji: "🐶" },
  { slug: "farmacia", label: "Farmacia", emoji: "💊" },
  { slug: "otros", label: "Otros", emoji: "📦" },
];

export const DEFAULT_CATEGORY_ORDER: string[] = CATEGORIES.map((c) => c.slug);

const CATEGORY_BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORY_BY_SLUG.get(slug);
}

/** Learned product-name → category mappings for a workspace (normalized name). */
export type CategoryMap = Record<string, string>;

// ── Normalization ────────────────────────────────────────────────────────────

/** lowercase, trim, strip accents (NFD), collapse internal whitespace. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ");
}

// ── Auto-categorization (keyword match) ──────────────────────────────────────
// Keywords are normalized (no accents, lowercase). Matching uses word boundaries
// so "pan" matches "pan" / "pan lactal" but not "panaderia" / "pantano".

const KEYWORDS: Record<string, string[]> = {
  lacteos: [
    "leche", "yogur", "yogurt", "queso", "manteca", "crema", "mozzarella",
    "ricotta", "sardo", "parmesano", "reggianito", "dambo", "fontina", "brie",
    "camembert", "kefir", "casancrem", "dulce de leche", "quesillo",
  ],
  carnes: [
    "carne", "pollo", "milanesa", "bife", "churrasco", "cerdo", "pescado",
    "salchicha", "chorizo", "jamon", "paleta", "hamburguesa", "lomo",
    "matambre", "asado", "costilla", "alitas", "muslo", "pechuga", "merluza",
    "salmon", "langostino", "camarones", "mariscos", "nuggets", "albondigas",
  ],
  verduleria: [
    "lechuga", "tomate", "cebolla", "papa", "zanahoria", "banana", "manzana",
    "naranja", "pera", "uva", "ajo", "pimiento", "morron", "zapallo",
    "calabaza", "espinaca", "acelga", "brocoli", "frutilla", "limon", "palta",
    "perejil", "albahaca", "rucula", "zapallito", "berenjena", "chaucha",
    "kiwi", "anana", "mandarina", "pomelo", "durazno", "ciruela", "cereza",
    "sandia", "melon", "apio", "rabanito", "remolacha", "batata", "boniato",
    "mandioca", "choclo", "arvejas frescas", "habas", "cebolla de verdeo",
  ],
  bebidas: [
    "agua", "jugo", "gaseosa", "coca", "pepsi", "sprite", "fanta", "cerveza",
    "vino", "whisky", "whiskey", "soda", "tonica", "energetica", "cafe", "te",
    "licor", "sidra", "champagne", "nectar", "americano", "lagrima",
  ],
  panaderia: [
    "pan", "facturas", "medialuna", "bizcochitos", "pan rallado", "pebetes",
    "chipa", "panqueques", "prepizza", "masa", "grisines", "salvado",
    "pan lactal", "pan de molde", "tortilla", "pan frances", "pan blanco",
  ],
  almacen: [
    "arroz", "fideos", "harina", "azucar", "sal", "aceite", "lentejas",
    "garbanzos", "porotos", "polenta", "avena", "cereales", "miel",
    "mermelada", "mayonesa", "mostaza", "ketchup", "atun", "salsa",
    "tomate triturado", "pure", "caldo", "cubito", "levadura",
    "polvo de hornear", "bicarbonato", "vinagre", "escabeche", "caballa",
    "sardinas", "maicena", "fecula", "coco rallado", "dulce de batata",
    "dulce de membrillo", "oleo", "tomate perita", "arvejas en lata",
    "choclo en grano", "canela", "vainilla", "pimienta", "oregano",
    "comino", "aji molido", "nuez moscada",
  ],
  limpieza: [
    "lavandina", "detergente", "esponja", "trapo", "alcohol", "virutex",
    "sapolio", "limpiador", "desodorante de piso", "bolsas", "escoba",
    "lampazon", "suavizante", "cloro", "amoniaco", "lavavajillas",
    "jabon en polvo", "jabon liquido", "papel cocina", "servilletas",
    "limpiavidrios", "lavamanchas", "paños", "fragancia", "saco",
  ],
  higiene: [
    "shampoo", "champu", "acondicionador", "pasta dental", "cepillo dental",
    "papel higienico", "algodon", "desodorante", "crema facial", "afeitar",
    "hojas de afeitar", "jabon de tocador", "toallas", "tampon", "toallitas",
    "perfume", "colonia", "lapiz labial", "rimel", "base de maquillaje",
    "sombra", "esmalte", "quitaesmalte", "tinte", "locion", "serum",
    "protector solar", "after sun", "jabon blanco",
  ],
  congelados: [
    "helado", "papas fritas congeladas", "pizza congelada", "verduras congeladas",
    "pescado congelado", "empanadas congeladas", "medallones", "sorrentinos",
    "raviol", "berlines", "waffles", "panqueques congelados", "aros de cebolla",
    "bastones de queso", "muzzarellas", "milanesas congeladas",
    "hamburguesas congeladas", "nuggets congelados",
  ],
  snacks: [
    "galletitas", "papas fritas", "palitos", "chizitos", "cocos", "alfajor",
    "caramelos", "nueces", "mani", "pasas", "chocolate", "turron", "chicle",
    "gomitas", "brownie", "chips", "doritos", "pringles", "cheetos", "rocklets",
    "sugus", "jorgito", "bon o bon", "tortita",
  ],
  mascotas: [
    "alimento perro", "alimento gato", "piedritas", "arena", "dog chow",
    "cat chow", "gati", "pro plan", "proplan", "excellency", "balanced",
    "sabrosito", "whiskas", "comida perro", "comida gato", "galletas perro",
    "antipulgas", "desparasitante", "shampoo perro",
  ],
  farmacia: [
    "ibuprofeno", "paracetamol", "aspirina", "curita", "tiritas", "vendas",
    "preservativo", "vitamina", "omeprazol", "loratadina", "amoxicilina",
    "alcohol en gel", "barbijo", "tapabocas", "guantes", "termometro",
    "oximetro", "tensiometro", "gasas", "suero", "repelente", "antimosquitos",
    "crema solar",
  ],
};

// Precompile word-boundary regexes, longest keywords first so specific phrases
// (e.g. "dulce de leche") win over single words (e.g. "leche").
const COMPILED: { slug: string; re: RegExp }[] = Object.entries(KEYWORDS)
  .flatMap(([slug, words]) => words.map((w) => ({ slug, word: w })))
  .sort((a, b) => b.word.length - a.word.length)
  .map(({ slug, word }) => ({
    slug,
    re: new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`),
  }));

/** Auto-categorize a normalized name by keyword match. Returns null if no match. */
export function autoCategorize(name: string): string | null {
  const normalized = normalizeName(name);
  if (!normalized) return null;
  for (const { slug, re } of COMPILED) {
    if (re.test(normalized)) return slug;
  }
  return null;
}

// ── Resolution (learned + auto, with barcode seam) ───────────────────────────

/**
 * Resolve a product's category. Learned mapping wins, then auto-categorization.
 * Returns null when undeterminable (caller prompts or falls back to "otros").
 *
 * The `barcode` arg is a seam for future Open Food Facts lookup — unused today.
 */
export function resolveCategory(
  name: string,
  learnedMap: CategoryMap,
  barcode?: string | null,
): string | null {
  void barcode; // reserved for future barcode → category lookup
  const normalized = normalizeName(name);
  if (learnedMap[normalized]) return learnedMap[normalized];
  return autoCategorize(normalized);
}

// ── Ordering ─────────────────────────────────────────────────────────────────

/**
 * The full category slug order for a workspace. Custom order respected, any
 * known categories missing from it appended after, "otros" always last.
 */
export function orderedCategorySlugs(custom: string[] | null): string[] {
  const known = new Set(CATEGORIES.map((c) => c.slug));
  const seen = new Set<string>();
  const result: string[] = [];

  for (const slug of custom ?? DEFAULT_CATEGORY_ORDER) {
    if (known.has(slug) && !seen.has(slug)) {
      seen.add(slug);
      result.push(slug);
    }
  }
  for (const c of CATEGORIES) {
    if (c.slug !== "otros" && !seen.has(c.slug)) {
      seen.add(c.slug);
      result.push(c.slug);
    }
  }
  if (!seen.has("otros")) result.push("otros");
  return result;
}
