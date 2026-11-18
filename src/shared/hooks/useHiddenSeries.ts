import { useState } from 'react';

// Which series of a chart the viewer has switched off through its legend (ui-requirements §4.5: legend
// toggling). Local UI state: it only changes what this chart draws.
export function useHiddenSeries() {
    const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

    const toggle = (key: string) => setHidden((current) => {
        const next = new Set(current);

        if (!next.delete(key)) {
            next.add(key);
        }

        return next;
    });

    return { isHidden: (key: string) => hidden.has(key), toggle };
}
