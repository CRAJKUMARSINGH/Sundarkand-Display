// Scene-sync data for the optional "narrative art" enrichment.
// Maps ranges of Sundarkand doha numbers to a contextual illustration + caption.
// This file is purely additive: it does not change sundarkandText.ts or any
// existing verse data, and the app works exactly as before if it is unused.
//
// Each of the 8 story beats is split into two consecutive sub-scenes so the
// art changes more often as the reader progresses: the first half uses the
// original illustration, the second half uses the newer sourced image
// (Ramanand Sagar's Ramayan serial stills / Raja Ravi Varma paintings).

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

// Splits an inclusive [start, end] doha range into two inclusive halves.
function splitRange(start: number, end: number): [[number, number], [number, number]] {
  if (start === end) return [[start, end], [start, end]];
  const mid = Math.floor((start + end) / 2);
  return [[start, mid], [Math.min(mid + 1, end), end]];
}

interface Beat {
  id: string;
  range: [number, number];
  captionHi: string;
  captionEn: string;
  oldImage: string;
  newImage: string;
}

const beats: Beat[] = [
  {
    id: "ocean-crossing",
    range: [1, 2],
    captionHi: "हनुमानजी का समुद्र-लंघन",
    captionEn: "Hanuman leaps across the ocean toward Lanka",
    oldImage: "/scenes/scene_ocean_crossing.jpg", // missing old, using new
    newImage: "/scenes/scene_ocean_crossing.jpg",
  },
  {
    id: "lanka-gate",
    range: [3, 11],
    captionHi: "रात्रि में लंका में प्रवेश",
    captionEn: "Entering Lanka by night",
    oldImage: "/scenes/scene_ocean_crossing.jpg", // both missing, using previous
    newImage: "/scenes/scene_ashoka_grove_old.jpg", // using next available
  },
  {
    id: "ashoka-grove",
    range: [12, 20],
    captionHi: "अशोक वाटिका में सीताजी से भेंट",
    captionEn: "Meeting Sita in the Ashoka grove",
    oldImage: "/scenes/scene_ashoka_grove_old.jpg",
    newImage: "/scenes/scene_ashoka_grove.jpg",
  },
  {
    id: "fruit-garden",
    range: [21, 29],
    captionHi: "फलों का उद्यान और बंधन",
    captionEn: "The fruit garden episode and capture",
    oldImage: "/scenes/scene_fruit_garden_old.jpg",
    newImage: "/scenes/scene_fruit_garden.jpg",
  },
  {
    id: "ravana-court",
    range: [30, 40],
    captionHi: "रावण की सभा",
    captionEn: "The audience with Ravana",
    oldImage: "/scenes/scene_ravana_court.jpg", // missing old, using new
    newImage: "/scenes/scene_ravana_court.jpg",
  },
  {
    id: "lanka-dahan",
    range: [41, 50],
    captionHi: "लंका दहन",
    captionEn: "The burning of Lanka",
    oldImage: "/scenes/scene_lanka_dahan_old.jpg",
    newImage: "/scenes/scene_lanka_dahan_old.jpg", // missing new, using old
  },
  {
    id: "return-leap",
    range: [51, 58],
    captionHi: "समुद्र-पार वापसी",
    captionEn: "The return leap across the ocean",
    oldImage: "/scenes/scene_return_leap.jpg", // missing old, using new
    newImage: "/scenes/scene_return_leap.jpg",
  },
  {
    id: "reunion",
    range: [59, 60],
    captionHi: "श्रीराम से पुनर्मिलन",
    captionEn: "Reporting back to Rama and the vanar army",
    oldImage: "/scenes/scene_reunion.jpg", // missing old, using new
    newImage: "/scenes/scene_reunion.jpg",
  },
];

export const scenes: Scene[] = beats.flatMap((beat) => {
  const [firstRange, secondRange] = splitRange(beat.range[0], beat.range[1]);
  return [
    {
      id: `${beat.id}-a`,
      range: firstRange,
      captionHi: beat.captionHi,
      captionEn: beat.captionEn,
      image: beat.oldImage,
    },
    {
      id: `${beat.id}-b`,
      range: secondRange,
      captionHi: beat.captionHi,
      captionEn: beat.captionEn,
      image: beat.newImage,
    },
  ];
});

export function sceneForDoha(dohaNum: number): Scene {
  const found = scenes.find(s => dohaNum >= s.range[0] && dohaNum <= s.range[1]);
  return found ?? scenes[0];
}
