export const savedMoviesStorageKey = "cinema-saved-films";

export function readSavedMovieIds(raw: string | null): number[] {
  try {
    const value: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((id): id is number =>
      typeof id === "number" && Number.isSafeInteger(id) && id > 0))].slice(0, 1000);
  } catch {
    return [];
  }
}
