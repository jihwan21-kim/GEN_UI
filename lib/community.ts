export type PublicAuthor = {
  user_id: string;
  handle: string;
  bio: string;
  avatar_url: string | null;
};

export type AuthorStats = PublicAuthor & {
  published_count: number;
  likes_received: number;
  net_votes: number;
  top_reviews: number;
};

export function buildAuthorMap(authors: PublicAuthor[]) {
  return Object.fromEntries(authors.map((author) => [author.user_id, author])) as Record<string, PublicAuthor>;
}

export function readableCount(value: number) {
  return Number(value || 0).toLocaleString("en-US");
}

export type RankingSort = "top_reviews" | "likes_received" | "published_count";
export const rankingModes: { value: RankingSort; title: string; description: string }[] = [
  { value: "top_reviews", title: "Most #1 reviews", description: "Film-leading one-liners with a positive net score" },
  { value: "likes_received", title: "Most likes", description: "Total likes earned by published one-liners" },
  { value: "published_count", title: "Most reviews", description: "Published AI-assisted one-liners" },
];

export function rankAuthors(authors: AuthorStats[], mode: RankingSort) {
  return [...authors].sort((a, b) =>
    Number(b[mode] || 0) - Number(a[mode] || 0)
    || Number(b.net_votes || 0) - Number(a.net_votes || 0)
    || a.handle.localeCompare(b.handle));
}
