import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Select } from 'antd';

import styles from './TestCaseFilters.module.scss';
import {
    EXECUTION_RESULTS,
    TEST_CASE_PRIORITIES,
    TEST_CASE_SEARCH_DEBOUNCE_MS,
    TEST_CASE_SEARCH_MAX_LENGTH,
    TEST_TYPES,
} from '../test-case.constant';
import { hasTestCaseFilters } from '../test-case.list-params';
import type { TestCaseListParamsType } from '../test-case.type';
import type { TestSuiteOption } from '../../test-suite/useTestSuiteOptions';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';

export type TestCaseFilterValues = Pick<
    TestCaseListParamsType,
    'search' | 'priorities' | 'types' | 'tags' | 'suiteId' | 'lastResults'
>;

const NO_FILTERS: TestCaseFilterValues = {
    search: '',
    priorities: [],
    types: [],
    tags: [],
    suiteId: undefined,
    lastResults: [],
};

type TestCaseFiltersProps = {
    // The current values, from the URL.
    values: TestCaseFilterValues;
    suiteOptions: TestSuiteOption[];
    onChange: (changes: Partial<TestCaseFilterValues>) => void;
};

// Lowercased, trimmed, no duplicates — the API matches tags case-insensitively anyway.
function normalizeTags(tags: string[]): string[] {
    return [...new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
}

export function TestCaseFilters({ values, suiteOptions, onChange }: TestCaseFiltersProps) {
    const { t } = useTranslation('testCase');

    // The box shows what is typed; the URL (and the request) follows once typing pauses (ui-requirements
    // §4.3, ~300 ms) — one request per pause, not per keystroke.
    const [searchText, setSearchText] = useState(values.search);
    const [syncedSearch, setSyncedSearch] = useState(values.search);
    const debouncedSearch = useDebouncedValue(searchText.trim(), TEST_CASE_SEARCH_DEBOUNCE_MS);

    // The URL changed from outside (back/forward, "Clear filters"): show its value. Adjusting state while
    // rendering, React's documented alternative to an effect for this.
    if (values.search !== syncedSearch) {
        setSyncedSearch(values.search);
        setSearchText(values.search);
    }

    // Writing to the URL is a side effect, so it lives in an effect. Only once the debounce has caught up
    // with the box: right after a back/forward the debounced value is still the old text and must not be
    // written back.
    useEffect(() => {
        if (debouncedSearch === searchText.trim() && debouncedSearch !== values.search) {
            onChange({ search: debouncedSearch });
        }
    }, [debouncedSearch, searchText, values.search, onChange]);

    return (
        <Flex className={styles['tb-test-case-filters']} gap="small" wrap align="center">
            <Input
                className={styles['tb-test-case-filters__search']}
                aria-label={t('filter.searchLabel')}
                placeholder={t('filter.searchPlaceholder')}
                prefix={<SearchOutlined />}
                allowClear
                maxLength={TEST_CASE_SEARCH_MAX_LENGTH}
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
            />
            <Select
                className={styles['tb-test-case-filters__select']}
                mode="multiple"
                maxTagCount="responsive"
                allowClear
                aria-label={t('filter.priorityPlaceholder')}
                placeholder={t('filter.priorityPlaceholder')}
                options={TEST_CASE_PRIORITIES.map((priority) => ({ value: priority, label: t(`priority.${priority}`) }))}
                value={values.priorities}
                onChange={(priorities) => onChange({ priorities })}
            />
            <Select
                className={styles['tb-test-case-filters__select']}
                mode="multiple"
                maxTagCount="responsive"
                allowClear
                aria-label={t('filter.typePlaceholder')}
                placeholder={t('filter.typePlaceholder')}
                options={TEST_TYPES.map((type) => ({ value: type, label: t(`type.${type}`) }))}
                value={values.types}
                onChange={(types) => onChange({ types })}
            />
            <Select
                className={styles['tb-test-case-filters__select']}
                // Free-form: the API has no list of a project's tags.
                mode="tags"
                maxTagCount="responsive"
                tokenSeparators={[',']}
                allowClear
                open={false}
                aria-label={t('filter.tagsPlaceholder')}
                placeholder={t('filter.tagsPlaceholder')}
                value={values.tags}
                onChange={(tags) => onChange({ tags: normalizeTags(tags) })}
            />
            <Select<number>
                className={styles['tb-test-case-filters__select']}
                allowClear
                showSearch={{ optionFilterProp: 'label' }}
                aria-label={t('filter.suitePlaceholder')}
                placeholder={t('filter.suitePlaceholder')}
                options={suiteOptions}
                value={values.suiteId}
                onChange={(suiteId) => onChange({ suiteId })}
            />
            <Select
                className={styles['tb-test-case-filters__select']}
                mode="multiple"
                maxTagCount="responsive"
                allowClear
                aria-label={t('filter.lastResultPlaceholder')}
                placeholder={t('filter.lastResultPlaceholder')}
                options={EXECUTION_RESULTS.map((result) => ({ value: result, label: t(`result.${result}`) }))}
                value={values.lastResults}
                onChange={(lastResults) => onChange({ lastResults })}
            />
            {hasTestCaseFilters(values) && (
                <Button type="link" onClick={() => onChange(NO_FILTERS)}>
                    {t('filter.clear')}
                </Button>
            )}
        </Flex>
    );
}
