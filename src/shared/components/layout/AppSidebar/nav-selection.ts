import type { AppNavItem } from './app-nav.type';

function isAtOrBelow(pathname: string, path: string): boolean {
    return pathname === path || pathname.startsWith(`${path}/`);
}

// The item for the current page: the one owning the longest path (its own or one of its matchPaths) that is
// the URL or a parent of it — so /projects/1/… selects the project's item rather than "Projects", and
// /projects-old wouldn't match /projects.
export function findSelectedKey(items: AppNavItem[], pathname: string): string | undefined {
    const matches = items.flatMap((item) => [item.path, ...(item.matchPaths ?? [])]
        .filter((path) => isAtOrBelow(pathname, path))
        .map((path) => ({ key: item.key, length: path.length })));

    return matches.sort((a, b) => b.length - a.length)[0]?.key;
}
