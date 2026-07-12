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
    image: "/scenes/scene_ocean_crossing.jpg",
  },
  {
    id: "lanka-gate",
    range: [3, 11],
    captionHi: "रात्रि में लंका में प्रवेश",
    captionEn: "Entering Lanka by night",
    image: "/scenes/scene_lanka_gate.jpg",
  },
  {
    id: "ashoka-grove",
    range: [12, 20],
    captionHi: "अशोक वाटिका में सीताजी से भेंट",
    captionEn: "Meeting Sita in the Ashoka grove",
    image: "/scenes/scene_ashoka_grove.jpg",
  },
  {
    id: "fruit-garden",
    range: [21, 29],
    captionHi: "फलों का उद्यान और बंधन",
    captionEn: "The fruit garden episode and capture",
    image: "/scenes/scene_fruit_garden.jpg",
  },
  {
    id: "ravana-court",
    range: [30, 40],
    captionHi: "रावण की सभा",
    captionEn: "The audience with Ravana",
    image: "/scenes/scene_ravana_court.jpg",
  },
  {
    id: "lanka-dahan",
    range: [41, 50],
    captionHi: "लंका दहन",
    captionEn: "The burning of Lanka",
    image: "/scenes/scene_lanka_dahan.jpg",
  },
  {
    id: "return-leap",
    range: [51, 58],
    captionHi: "समुद्र-पार वापसी",
    captionEn: "The return leap across the ocean",
    image: "/scenes/scene_return_leap.jpg",
  },
  {
    id: "reunion",
    range: [59, 60],
    captionHi: "श्रीराम से पुनर्मिलन",
    captionEn: "Reporting back to Rama and the vanar army",
    image: "/scenes/scene_reunion.jpg",
  },
];

export function sceneForDoha(dohaNum: number): Scene {
  const found = scenes.find(s => dohaNum >= s.range[0] && dohaNum <= s.range[1]);
  return found ?? scenes[0];
}
