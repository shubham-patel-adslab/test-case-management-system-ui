import dayjs, { type Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { DatePicker, Flex, Segmented } from 'antd';

import { ANALYTICS_RANGE_MAX_DAYS, ANALYTICS_RANGE_PRESETS } from '../analytics.constant';
import { toAnalyticsDays } from '../analytics.range';
import type { AnalyticsPresetDays, AnalyticsRangeType } from '../analytics.type';

const DAY_FORMAT = 'YYYY-MM-DD';
const DISPLAY_FORMAT = 'DD MMM YYYY';
const CUSTOM = 'custom';

type AnalyticsRangeFilterProps = {
    range: AnalyticsRangeType;
    today: string;
    onChange: (range: AnalyticsRangeType) => void;
};

// Last 7 / 30 / 90 days, or custom calendar days: at most 366, none after today — what the API accepts, so the
// picker can't produce a 400.
export function AnalyticsRangeFilter({ range, today, onChange }: AnalyticsRangeFilterProps) {
    const { t } = useTranslation('analytics');
    const days = toAnalyticsDays(range, today);
    const selected = range.kind === 'custom' ? CUSTOM : String(range.days);

    const options = [
        ...ANALYTICS_RANGE_PRESETS.map((presetDays) => ({ value: String(presetDays), label: t(`range.preset_${presetDays}`) })),
        { value: CUSTOM, label: t('range.custom') },
    ];

    // Switching to custom starts from the days shown now, so the dashboard doesn't change until a new pick.
    const handlePresetChange = (value: string) => {
        onChange(value === CUSTOM
            ? { kind: 'custom', ...days }
            : { kind: 'preset', days: Number(value) as AnalyticsPresetDays });
    };

    const isDisabledDay = (current: Dayjs, { from }: { from?: Dayjs }) => current.isAfter(dayjs(today), 'day')
        || (!!from && Math.abs(current.diff(from, 'day')) >= ANALYTICS_RANGE_MAX_DAYS);

    return (
        <Flex gap="small" wrap align="center">
            <Segmented aria-label={t('range.label')} options={options} value={selected} onChange={handlePresetChange} />
            {range.kind === 'custom' && (
                <DatePicker.RangePicker
                    aria-label={t('range.customLabel')}
                    allowClear={false}
                    format={DISPLAY_FORMAT}
                    placeholder={[t('range.fromPlaceholder'), t('range.toPlaceholder')]}
                    value={[dayjs(range.from), dayjs(range.to)]}
                    disabledDate={isDisabledDay}
                    onChange={(values) => {
                        if (values?.[0] && values[1]) {
                            onChange({ kind: 'custom', from: values[0].format(DAY_FORMAT), to: values[1].format(DAY_FORMAT) });
                        }
                    }}
                />
            )}
        </Flex>
    );
}
