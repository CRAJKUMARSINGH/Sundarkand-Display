// Scene-sync data for the optional "narrative art" enrichment.
// Maps ranges of Sundarkand doha numbers to a contextual illustration + caption.
// This file is purely additive: it does not change sundarkandText.ts or any
// existing verse data, and the app works exactly as before if it is unused.

export interface Scene {
  id: string;
  /** Inclusive doha-number range this scene covers. */
  range: [number, number];
  /** Short Hindi caption shown under the illustration. */
  captionHi: string;
  /** Short English caption for readers unfamiliar with the story sequence. */
  captionEn: string;
  /** Image path, relative to the app's public/ directory. */
  image: string;
}

export const scenes: Scene[] = [
  {
    id: "ocean-crossing",
    range: [1, 2],
    captionHi: "हनुमानजी का समुद्र-लंघन",
    captionEn: "Hanuman leaps across the ocean toward Lanka",
    image: "/scenes/scene_ocean_crossing.svg",
  },
  {
    id: "lanka-gate",
    range: [3, 12],
    captionHi: "रात्रि में लंका में प्रवेश",
    captionEn: "Entering Lanka by night",
    image: "/scenes/scene_lanka_gate.svg",
  },
  {
    id: "ashoka-grove",
    range: [13, 20],
    captionHi: "अशोक वाटिका में सीताजी से भेंट",
    captionEn: "Meeting Sita in the Ashoka grove",
    image: "/scenes/scene_ashoka_grove.svg",
  },
  {
    id: "fruit-garden",
    range: [21, 29],
    captionHi: "फलों का उद्यान और बंधन",
    captionEn: "The fruit garden episode and capture",
    image: "/scenes/scene_fruit_garden.svg",
  },
  {
    id: "ravana-court",
    range: [30, 34],
    captionHi: "रावण की सभा और प्रस्थान",
    captionEn: "The audience with Ravana and departure",
    image: "/scenes/scene_ravana_court.svg",
  },
  {
    id: "lanka-dahan",
    range: [35, 56],
    captionHi: "लंका दहन और वापसी",
    captionEn: "The burning of Lanka and the return leap",
    image: "/scenes/scene_lanka_dahan.svg",
  },
  {
    id: "reunion",
    range: [57, 60],
    captionHi: "श्रीराम से पुनर्मिलन",
    captionEn: "Reporting back to Rama and the vanar army",
    image: "/scenes/scene_reunion.svg",
  },
];

export function sceneForDoha(dohaNum: number): Scene {
  const found = scenes.find(s => dohaNum >= s.range[0] && dohaNum <= s.range[1]);
  return found ?? scenes[0];
}
