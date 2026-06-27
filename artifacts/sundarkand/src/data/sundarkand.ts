// ─────────────────────────────────────────────────────────────
// Sundarkand Teleprompter — Data
// Tulsidas / Ramcharitmanas (public domain, 16th century)
// Text placeholders: replace with your authentic Geeta Press copy
// ─────────────────────────────────────────────────────────────

export interface Doha {
  number: string;
  text: string;
}

export interface Section {
  doha: Doha;
  chaupaiPlaceholders: string[];
}

export interface Part {
  id: string;
  title: string;         // Devanagari title shown in header
  subtitle: string;      // Short English label for controls bar
  durationSec: number;   // Standard recitation time in seconds
  accentColor: string;   // CSS colour for this part's header/border
  headerLines: string[]; // Opening invocation lines
  body: PartBody;        // Content variant
}

export type PartBody =
  | { kind: "sundarkand";       sections: Section[] }
  | { kind: "chalisa";          verses: string[] }
  | { kind: "aarti";            verses: string[] }
  | { kind: "bajrangbaan";      sections: BajrangSection[] };

export interface BajrangSection {
  label: string;
  verses: string[];
}

// ─────────────────────────────────────────────────────────────
// PART 1 — Sundarkand  (1h 54m 34s)
// ─────────────────────────────────────────────────────────────
const sundarkandSections: Section[] = Array.from({ length: 60 }, (_, i) => ({
  doha: {
    number: String(i + 1),
    text: `दोहा ${i + 1} — (यहाँ गीताप्रेस की प्रामाणिक पंक्तियाँ लगाएँ)`,
  },
  chaupaiPlaceholders: Array.from(
    { length: i % 3 === 0 ? 6 : i % 3 === 1 ? 5 : 4 },
    (_, j) => `चौपाई ${j + 1} — (यहाँ गीताप्रेस की प्रामाणिक चौपाई लगाएँ)`
  ),
}));

// ─────────────────────────────────────────────────────────────
// PART 2 — Hanuman Chalisa  (standard: 6m 30s = 390s)
// Structure: 2 opening dohas + 40 chaupais + 1 closing doha
// Replace placeholders with your Geeta Press copy
// ─────────────────────────────────────────────────────────────
const chalisaVerses: string[] = [
  "दोहा (आरम्भ) १ — (यहाँ प्रामाणिक पंक्तियाँ लगाएँ)",
  "दोहा (आरम्भ) २ — (यहाँ प्रामाणिक पंक्तियाँ लगाएँ)",
  ...Array.from({ length: 40 }, (_, i) => `चौपाई ${i + 1} — (यहाँ प्रामाणिक पंक्तियाँ लगाएँ)`),
  "दोहा (समाप्ति) — (यहाँ प्रामाणिक पंक्तियाँ लगाएँ)",
];

// ─────────────────────────────────────────────────────────────
// PART 3 — Hanuman Aarti  (standard: 3m 30s = 210s)
// Replace placeholders with your Geeta Press copy
// ─────────────────────────────────────────────────────────────
const hanumanAartiVerses: string[] = Array.from(
  { length: 7 },
  (_, i) => `आरती छंद ${i + 1} — (यहाँ प्रामाणिक पंक्तियाँ लगाएँ)`
);

// ─────────────────────────────────────────────────────────────
// PART 4 — Ram Aarti  (standard: 3m 0s = 180s)
// Replace placeholders with your Geeta Press copy
// ─────────────────────────────────────────────────────────────
const ramAartiVerses: string[] = Array.from(
  { length: 6 },
  (_, i) => `आरती छंद ${i + 1} — (यहाँ प्रामाणिक पंक्तियाँ लगाएँ)`
);

// ─────────────────────────────────────────────────────────────
// PART 5 — Bajrang Baan (Lata Mangeshkar)  (standard: 11m = 660s)
// Structure: doha + chaupais + soratha + closing
// Replace placeholders with your Geeta Press copy
// ─────────────────────────────────────────────────────────────
const bajrangSections: BajrangSection[] = [
  {
    label: "दोहा",
    verses: ["दोहा — (यहाँ प्रामाणिक पंक्तियाँ लगाएँ)"],
  },
  {
    label: "चौपाई",
    verses: Array.from({ length: 28 }, (_, i) => `चौपाई ${i + 1} — (यहाँ प्रामाणिक पंक्तियाँ लगाएँ)`),
  },
  {
    label: "सोरठा",
    verses: ["सोरठा — (यहाँ प्रामाणिक पंक्तियाँ लगाएँ)"],
  },
  {
    label: "समापन",
    verses: ["समापन दोहा — (यहाँ प्रामाणिक पंक्तियाँ लगाएँ)"],
  },
];

// ─────────────────────────────────────────────────────────────
// PARTS ARRAY  (order = display order)
// ─────────────────────────────────────────────────────────────
export const parts: Part[] = [
  {
    id: "sundarkand",
    title: "सुन्दरकाण्ड",
    subtitle: "Sundarkand",
    durationSec: 6874,
    accentColor: "#FF6B00",
    headerLines: [
      "श्री गणेशाय नमः",
      "श्री जानकीवल्लभो विजयते",
      "श्रीरामचरितमानस — पञ्चम सोपान",
    ],
    body: { kind: "sundarkand", sections: sundarkandSections },
  },
  {
    id: "chalisa",
    title: "हनुमान चालीसा",
    subtitle: "Hanuman Chalisa",
    durationSec: 390,
    accentColor: "#FF9800",
    headerLines: [
      "श्री हनुमान चालीसा",
      "— गोस्वामी तुलसीदास —",
    ],
    body: { kind: "chalisa", verses: chalisaVerses },
  },
  {
    id: "hanuman-aarti",
    title: "हनुमान आरती",
    subtitle: "Hanuman Aarti",
    durationSec: 210,
    accentColor: "#FFB300",
    headerLines: [
      "आरती कीजे हनुमान लला की",
    ],
    body: { kind: "aarti", verses: hanumanAartiVerses },
  },
  {
    id: "ram-aarti",
    title: "राम आरती",
    subtitle: "Ram Aarti",
    durationSec: 180,
    accentColor: "#4CAF50",
    headerLines: [
      "आरती श्री रामजी की",
    ],
    body: { kind: "aarti", verses: ramAartiVerses },
  },
  {
    id: "bajrangbaan",
    title: "बजरंग बाण",
    subtitle: "Bajrang Baan",
    durationSec: 660,
    accentColor: "#E53935",
    headerLines: [
      "बजरंग बाण",
      "— लता मंगेशकर शैली —",
    ],
    body: { kind: "bajrangbaan", sections: bajrangSections },
  },
];

// ─────────────────────────────────────────────────────────────
// DERIVED CONSTANTS
// ─────────────────────────────────────────────────────────────

// Cumulative start offset (ms) for each part
export const partOffsets: number[] = parts.reduce<number[]>((acc, p, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + parts[i - 1].durationSec * 1000);
  return acc;
}, []);

// Total duration across all parts
export const TOTAL_DURATION_MS = parts.reduce((sum, p) => sum + p.durationSec * 1000, 0);

// Border dohas shown rotating on the 4 edges during Sundarkand
export const borderDohas: Doha[] = [
  { number: "1",  text: "दोहा १ — (गीताप्रेस पाठ)" },
  { number: "5",  text: "दोहा ५ — (गीताप्रेस पाठ)" },
  { number: "10", text: "दोहा १० — (गीताप्रेस पाठ)" },
  { number: "16", text: "दोहा १६ — (गीताप्रेस पाठ)" },
  { number: "21", text: "दोहा २१ — (गीताप्रेस पाठ)" },
  { number: "30", text: "दोहा ३० — (गीताप्रेस पाठ)" },
  { number: "42", text: "दोहा ४२ — (गीताप्रेस पाठ)" },
  { number: "55", text: "दोहा ५५ — (गीताप्रेस पाठ)" },
  { number: "60", text: "दोहा ६० — (गीताप्रेस पाठ)" },
];
