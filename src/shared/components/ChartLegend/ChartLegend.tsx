import styles from './ChartLegend.module.scss';

export type ChartLegendItem = {
    key: string;
    label: string;
    color: string;
    isHidden: boolean;
};

type ChartLegendProps = {
    items: ChartLegendItem[];
    onToggle: (key: string) => void;
    // Names the legend for screen readers, e.g. "Show or hide results".
    label: string;
};

// A chart's legend as real buttons: each shows or hides its series, by mouse or keyboard (Recharts' own
// legend isn't focusable). The text stays in text colors; the swatch carries the series color.
export function ChartLegend({ items, onToggle, label }: ChartLegendProps) {
    return (
        <div role="group" aria-label={label} className={styles['tb-chart-legend']}>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    aria-pressed={!item.isHidden}
                    className={styles['tb-chart-legend__item']}
                    onClick={() => onToggle(item.key)}
                >
                    <span
                        className={styles['tb-chart-legend__swatch']}
                        style={{ '--tb-chart-legend-swatch-color': item.color } as React.CSSProperties}
                        aria-hidden="true"
                    />
                    {item.label}
                </button>
            ))}
        </div>
    );
}
