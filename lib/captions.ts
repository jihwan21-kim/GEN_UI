export const tones = ["Dry humor", "Chaotic", "Wholesome"] as const;
export type Restaurant = {
  id: number;
  name: string;
  category: string;
  address?: string | null;
  photo_path?: string | null;
  created_by?: string | null;
};
export type Caption = {
  id: string;
  restaurant_id: number;
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
