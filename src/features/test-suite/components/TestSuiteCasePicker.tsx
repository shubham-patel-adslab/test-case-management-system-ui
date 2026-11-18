import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { App, Form, Modal, Select, Typography } from 'antd';

import styles from './TestSuiteCasePicker.module.scss';
import { addTestSuiteCases } from '../test-suite.api';
import {
    TEST_SUITE_ADD_CASES_MAX,
    TEST_SUITE_CASE_PICKER_DEBOUNCE_MS,
    TEST_SUITE_CASE_PICKER_PAGE_SIZE,
} from '../test-suite.constant';
import { testSuiteDetailsQueryKey, testSuitesQueryKey } from '../test-suite.query';
import type { TestSuiteDetailsType } from '../test-suite.type';
import { getTestCases } from '../../test-case/test-case.api';
import { testCaseListQueryKey, testCasesQueryKey } from '../../test-case/test-case.query';
import type { TestCasePageRequestDto } from '../../test-case/test-case.request.dto';
import { API_ERROR_CODE, getApiErrorCode } from '../../../app/api-error';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';

type PickedTestCase = { value: number; label: React.ReactNode };

type TestSuiteCasePickerProps = {
    projectId: number;
    suite: TestSuiteDetailsType;
    // The page mounts the picker only while it's open, so every opening starts empty.
    onClose: () => void;
};

// Adds test cases to a suite: searches the project's test cases on the server (only while the list is
// open, debounced), up to 100 per call, appended in the order picked.
export function TestSuiteCasePicker({ projectId, suite, onClose }: TestSuiteCasePickerProps) {
    const { t } = useTranslation('testSuite');
    const { message } = App.useApp();
    const queryClient = useQueryClient();

    // labelInValue keeps each picked case's title, even when it isn't among the current search results.
    const [picked, setPicked] = useState<PickedTestCase[]>([]);
    const [search, setSearch] = useState('');
    const [isListOpen, setIsListOpen] = useState(false);
    const debouncedSearch = useDebouncedValue(search.trim(), TEST_SUITE_CASE_PICKER_DEBOUNCE_MS);

    const request: TestCasePageRequestDto = {
        page: 1,
        pageSize: TEST_SUITE_CASE_PICKER_PAGE_SIZE,
        // Title A→Z: the API's default order.
        search: debouncedSearch || undefined,
    };

    const candidatesQuery = useQuery({
        queryKey: testCaseListQueryKey(projectId, request),
        queryFn: ({ signal }) => getTestCases(projectId, request, signal),
        enabled: isListOpen,
        placeholderData: keepPreviousData,
    });

    // The suite's cases as the picker opened: after a successful add the suite refreshes before the picker
    // closes, and the just-picked options must not turn into "already in this suite" while still selected.
    const [inSuite] = useState(() => new Set(suite.testCases.map((testCase) => testCase.id)));
    const candidates = candidatesQuery.data?.items ?? [];
    const options = candidates.map((testCase) => ({
        value: testCase.id,
        // Cases already in the suite stay listed (so a search doesn't look broken), but can't be picked.
        label: inSuite.has(testCase.id) ? `${testCase.title} — ${t('cases.inSuite')}` : testCase.title,
        disabled: inSuite.has(testCase.id),
    }));
    const totalMatches = candidatesQuery.data?.totalItems ?? 0;

    const addMutation = useMutation({
        mutationFn: (testCaseIds: number[]) => addTestSuiteCases(projectId, suite.id, { testCaseIds }),
        onSuccess: async (details) => {
            // The response is the suite with its new order: show it right away, then refresh what changed
            // elsewhere (suite counts, the test cases' suiteIds).
            queryClient.setQueryData(testSuiteDetailsQueryKey(projectId, suite.id), details);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: testSuitesQueryKey(projectId) }),
                queryClient.invalidateQueries({ queryKey: testCasesQueryKey(projectId) }),
            ]);
            message.success(t('cases.added', { count: details.testCases.length - suite.testCases.length }));
            onClose();
        },
        onError: (error) => {
            // A picked case was deleted meanwhile (400 on testCaseIds[i]); nothing was added.
            if (getApiErrorCode(error) === API_ERROR_CODE.VALIDATION_ERROR) {
                setPicked([]);
                void queryClient.invalidateQueries({ queryKey: testCasesQueryKey(projectId) });
                message.warning(t('cases.addStale'));
                return;
            }

            console.error('Failed to add test cases to the suite:', error);
            message.error(t('cases.addError'));
        },
    });

    return (
        <Modal
            open
            title={t('cases.pickerTitle', { suite: suite.name })}
            okText={t('cases.pickerSubmit')}
            okButtonProps={{ disabled: picked.length === 0, loading: addMutation.isPending }}
            cancelText={t('action.cancel')}
            cancelButtonProps={{ disabled: addMutation.isPending }}
            onOk={() => addMutation.mutate(picked.map((testCase) => testCase.value))}
            onCancel={onClose}
        >
            <Form layout="vertical" component={false}>
                <Form.Item label={t('cases.pickerLabel')} htmlFor="test-suite-case-picker" extra={t('cases.pickerHelp')}>
                    <Select<PickedTestCase[]>
                        id="test-suite-case-picker"
                        mode="multiple"
                        labelInValue
                        maxCount={TEST_SUITE_ADD_CASES_MAX}
                        value={picked}
                        onChange={setPicked}
                        onSelect={() => setSearch('')}
                        showSearch={{
                            filterOption: false,
                            searchValue: search,
                            onSearch: setSearch,
                            autoClearSearchValue: false,
                        }}
                        onOpenChange={setIsListOpen}
                        options={options}
                        loading={candidatesQuery.isFetching}
                        placeholder={t('cases.pickerPlaceholder')}
                        notFoundContent={candidatesQuery.isFetching ? t('cases.pickerLoading') : t('cases.pickerNotFound')}
                        popupRender={(menu) => (
                            <>
                                {menu}
                                {totalMatches > candidates.length && (
                                    <Typography.Text type="secondary" className={styles['tb-test-suite-case-picker__more']}>
                                        {t('cases.pickerMore', { shown: candidates.length, total: totalMatches })}
                                    </Typography.Text>
                                )}
                            </>
                        )}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
