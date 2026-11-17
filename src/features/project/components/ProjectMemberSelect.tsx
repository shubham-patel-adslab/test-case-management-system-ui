import { useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Form, Select, Tag, Typography } from 'antd';

import styles from './ProjectMemberSelect.module.scss';
import { getProjectMemberCandidates } from '../project.api';
import { MEMBER_CANDIDATE_PAGE_SIZE, MEMBER_SEARCH_DEBOUNCE_MS } from '../project.constant';
import { toProjectMemberCandidatePage } from '../project.mapper';
import type { ProjectFormType, ProjectMemberType } from '../project.type';
import { DEFAULT_PAGE } from '../../../shared/constant/page.constant';
import { formatFullName } from '../../../shared/format/name.format';
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue';

const FIELD_NAME = 'memberIds';

// "Kabir Singh (Invited)" — the status only when it isn't the normal one.
function useMemberName() {
    const { t } = useTranslation('user');

    return (member: ProjectMemberType) => {
        const name = formatFullName(member.firstName, member.lastName);

        return member.status === 'ACTIVE' ? name : `${name} (${t(`status.${member.status}`)})`;
    };
}

type ProjectMemberSelectProps = {
    control: Control<ProjectFormType>;
    // The team as loaded (or the creator on a new project), so their tags have names before any search.
    initialMembers: ProjectMemberType[];
    // The signed-in user when they can only see projects they're on: the API keeps them on the team anyway,
    // so the UI doesn't offer removing them.
    lockedMemberId?: string;
    errorMessage?: string;
};

// The whole team in one multi-select, searched on the server (GET /projects/member-candidates): the user
// list can be far larger than one page, so options are the first matches for what's typed, not every user.
export function ProjectMemberSelect({ control, initialMembers, lockedMemberId, errorMessage }: ProjectMemberSelectProps) {
    const { t } = useTranslation('project');
    const getMemberName = useMemberName();

    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebouncedValue(search.trim(), MEMBER_SEARCH_DEBOUNCE_MS);

    // Everyone seen so far (the team, plus each picked candidate), so a tag keeps its name after the
    // search results change.
    const [knownMembers, setKnownMembers] = useState(
        () => new Map(initialMembers.map((member) => [member.id, member])),
    );

    // Fetched only while the list is open — most edits never touch the team.
    const candidatesQuery = useQuery({
        queryKey: ['projects', 'member-candidates', { search: debouncedSearch }],
        queryFn: ({ signal }) => getProjectMemberCandidates(
            { page: DEFAULT_PAGE, pageSize: MEMBER_CANDIDATE_PAGE_SIZE, search: debouncedSearch || undefined },
            signal,
        ),
        enabled: isOpen,
        placeholderData: keepPreviousData,
    });

    const candidatePage = candidatesQuery.data ? toProjectMemberCandidatePage(candidatesQuery.data) : undefined;
    const candidates = candidatePage?.items ?? [];
    const hasMoreCandidates = !!candidatePage && candidatePage.totalItems > candidates.length;

    const options = candidates.map((member) => ({
        value: member.id,
        label: `${getMemberName(member)} · ${member.email}`,
        disabled: member.id === lockedMemberId,
    }));

    return (
        <Form.Item
            label={t('form.membersLabel')}
            htmlFor={FIELD_NAME}
            validateStatus={errorMessage ? 'error' : ''}
            help={errorMessage && t(errorMessage)}
            extra={lockedMemberId && t('form.membersSelfLocked')}
        >
            <Controller
                name={FIELD_NAME}
                control={control}
                render={({ field }) => (
                    <Select<string[]>
                        id={FIELD_NAME}
                        mode="multiple"
                        value={field.value}
                        onBlur={field.onBlur}
                        // Backspace can remove the last tag even when it's locked; put it back.
                        onChange={(ids) => field.onChange(
                            lockedMemberId && !ids.includes(lockedMemberId) ? [lockedMemberId, ...ids] : ids,
                        )}
                        onSelect={(id: string) => {
                            const member = candidates.find((candidate) => candidate.id === id);

                            if (member) {
                                setKnownMembers((previous) => new Map(previous).set(id, member));
                            }

                            setSearch('');
                        }}
                        showSearch={{
                            filterOption: false,
                            searchValue: search,
                            onSearch: setSearch,
                            autoClearSearchValue: false,
                        }}
                        onOpenChange={(open) => {
                            setIsOpen(open);

                            if (!open) {
                                setSearch('');
                            }
                        }}
                        options={options}
                        loading={candidatesQuery.isFetching}
                        placeholder={t('form.membersPlaceholder')}
                        notFoundContent={candidatesQuery.isFetching ? t('form.membersLoading') : t('form.membersNotFound')}
                        tagRender={({ value, closable, onClose }) => {
                            const member = knownMembers.get(value as string);

                            return (
                                <Tag
                                    className={styles['tb-project-member-select__tag']}
                                    closable={closable && value !== lockedMemberId}
                                    onClose={onClose}
                                    // Clicking a tag shouldn't open the list (antd's tagRender guidance).
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                    }}
                                >
                                    {member ? getMemberName(member) : value}
                                </Tag>
                            );
                        }}
                        popupRender={(menu) => (
                            <>
                                {menu}
                                {hasMoreCandidates && (
                                    <Typography.Text type="secondary" className={styles['tb-project-member-select__more']}>
                                        {t('form.membersMore', { shown: candidates.length, total: candidatePage.totalItems })}
                                    </Typography.Text>
                                )}
                            </>
                        )}
                    />
                )}
            />
        </Form.Item>
    );
}
