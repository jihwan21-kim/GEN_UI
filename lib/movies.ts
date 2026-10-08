export const movieGenres = [
  "Action", "Animation", "Comedy", "Crime", "Documentary", "Drama",
  "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller",
] as const;

export const reviewTones = ["Witty", "Serious", "Poetic", "Sarcastic"] as const;
export type ReviewTone = (typeof reviewTones)[number];

export type Movie = {
  id: number;
  title: string;
  release_year: number;
  genres: string[];
  poster_path: string | null;
  created_by: string | null;
  created_at: string;
};

export type MovieReview = {
  id: string;
  movie_id: number;
  one_liner: string;
  tone: ReviewTone;
  created_at: string;
};

export type MovieScore = {
  review_id: string;
  upvotes: number;
  downvotes: number;
};

export type MovieVote = {
  review_id: string;
  value: number;
};

export function reviewScore(score?: MovieScore) {
  return Number(score?.upvotes || 0) - Number(score?.downvotes || 0);
}

export function sortMovieReviews(reviews: MovieReview[], scores: MovieScore[]) {
  const scoreById = new Map(scores.map((s) => [s.review_id, s]));
  return [...reviews].sort((a, b) => (
    reviewScore(scoreById.get(b.id)) - reviewScore(scoreById.get(a.id))
    || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ));
}
