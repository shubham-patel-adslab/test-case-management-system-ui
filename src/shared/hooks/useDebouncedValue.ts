import { useEffect, useState } from 'react';

// The value, but only once it has stopped changing for `delayMs` — e.g. a search box that should send one
// request after the user pauses typing, not one per keystroke (ui-requirements §4.3: ~300 ms).
export function useDebouncedValue<TValue>(value: TValue, delayMs: number): TValue {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebouncedValue(value), delayMs);

        return () => clearTimeout(timeoutId);
    }, [value, delayMs]);

    return debouncedValue;
}
