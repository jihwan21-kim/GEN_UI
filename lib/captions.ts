export const tones = ["Dry humor", "Chaotic", "Wholesome"] as const;
export const topics = [
  "Paying NYC prices on a student budget",
  "The subway becoming your weekend adventure",
  "Finding your new favorite food near campus",
  "Dorm cooking with exactly one clean fork",
  "A study break that turns into a city walk",
  "Midwest small talk meets New York energy",
  "Waiting in line for a viral restaurant",
];

export function dailyTopic(date = new Date()) {
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const index =
    [...day].reduce((sum, c) => sum + c.charCodeAt(0), 0) % topics.length;
  return topics[index];
}

export type Caption = {
  id: string;
  topic: string;
  tone: string;
  caption: string;
  prompt: string;
  model: string;
  created_at: string;
};
export type Score = {
  generation_id: string;
  upvotes: number;
  downvotes: number;
};
