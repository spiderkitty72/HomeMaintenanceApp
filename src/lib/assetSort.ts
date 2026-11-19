/** Favorites first, then everything else; each group in alphabetical order by name. */
export function sortAssetsForDashboard<T extends { name: string; isFavorite: boolean }>(assets: T[]): T[] {
    return [...assets].sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
    });
}
