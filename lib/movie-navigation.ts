export const returnMovieStorageKey = "cinema-return-film";

export function parseMovieId(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

export function movieReturnPath(movieId: number | null) {
  return movieId ? `/?film=${movieId}` : "/";
}

export function movieLoginPath(movieId: number) {
  return `/login?film=${movieId}`;
}
