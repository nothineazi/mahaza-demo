/** Ajoute la valeur si absente, la retire sinon. */
export function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}
