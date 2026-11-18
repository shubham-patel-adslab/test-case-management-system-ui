export type AppNavItem = {
    key: string;
    path: string;
    // Other paths this item owns (and everything below them), for pages that live outside its own path —
    // e.g. a section whose detail pages have their own URL root.
    matchPaths?: string[];
    icon: React.ReactNode;
    // i18n key in the 'common' namespace.
    labelKey: string;
};

// A titled section below the main items (e.g. the pages of the current project).
export type AppNavGroup = {
    key: string;
    // Already display text (e.g. a project name), not an i18n key.
    title: string;
    items: AppNavItem[];
};
