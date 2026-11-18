import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Button, Flex, Input, Select, Table, type TableColumnsType, type TableProps } from 'antd';

import { UserStatusTag } from '../components/UserStatusTag';
import { getUsers } from '../user.api';
import { USER_DEFAULT_SORT, USER_SORT_FIELDS, USER_STATUSES } from '../user.constant';
import { toUserPage } from '../user.mapper';
import type { UserDetailsType, UserStatus } from '../user.type';
import { useAuth } from '../../auth/auth.context';
import { PERMISSION_CODE, RESOURCE_CODE } from '../../auth/auth.constant';
import { PageHeader } from '../../../shared/components/PageHeader';
import { QueryErrorState } from '../../../shared/components/QueryErrorState';
import { QueryLoadingState } from '../../../shared/components/QueryLoadingState';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../../shared/constant/page.constant';
import { SORT_PARAM } from '../../../shared/constant/sort.constant';
import { fromTableSorter, parseListSort, setListSortParam, toColumnSortOrder, toSortParam } from '../../../shared/list/list-sort';
import { formatDate } from '../../../shared/format/date.format';
import { formatFullName } from '../../../shared/format/name.format';
import styles from './UserPaginationPage.module.scss';

function isUserStatus(value: string | null): value is UserStatus {
    return USER_STATUSES.some((status) => status === value);
}

export function UserPaginationPage() {
    const { t } = useTranslation('user');
    const navigate = useNavigate();
    const { can } = useAuth();

    const [searchParams, setSearchParams] = useSearchParams();

    const page = Number(searchParams.get('page')) || DEFAULT_PAGE;
    const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;
    const search = searchParams.get('search') ?? '';
    const statusParam = searchParams.get('status');
    // An unknown status in a hand-edited URL is ignored rather than sent (the API would answer 400).
    const status = isUserStatus(statusParam) ? statusParam : undefined;
    // Server-side order, in the URL; name A→Z (the API default) unless the user picks another.
    const sort = parseListSort(searchParams.get(SORT_PARAM), USER_SORT_FIELDS, USER_DEFAULT_SORT);

    const request = { page, pageSize, search: search || undefined, status, sort: toSortParam(sort, USER_DEFAULT_SORT) };

    const userQuery = useQuery({
        queryKey: ['users', 'list', request],
        queryFn: ({ signal }) => getUsers(request, signal),
        placeholderData: keepPreviousData,
    });

    // Filters go back to page 1: the current page may not exist in the filtered result.
    const updateFilter = (name: 'search' | 'status', value: string | undefined) => {
        setSearchParams((prev) => {
            if (value) {
                prev.set(name, value);
            } else {
                prev.delete(name);
            }
            prev.set('page', String(DEFAULT_PAGE));
            return prev;
        });
    };

    const handleTableChange: TableProps<UserDetailsType>['onChange'] = (_pagination, _filters, sorter, extra) => {
        if (extra.action === 'sort') {
            setSearchParams((prev) => setListSortParam(prev, fromTableSorter(sorter, USER_SORT_FIELDS, USER_DEFAULT_SORT), USER_DEFAULT_SORT));
        }
    };

    if (userQuery.isError) {
        return <QueryErrorState onRetry={() => void userQuery.refetch()} />;
    }

    if (!userQuery.data) {
        return <QueryLoadingState />;
    }

    const userPage = toUserPage(userQuery.data);
    const canUpdate = can(RESOURCE_CODE.USER, PERMISSION_CODE.UPDATE);

    const columns: TableColumnsType<UserDetailsType> = [
        {
            title: t('table.nameColumn'),
            key: 'name',
            sorter: true,
            sortOrder: toColumnSortOrder(sort, 'name'),
            render: (_, user) => <Link to={`/users/${user.id}`}>{formatFullName(user.firstName, user.lastName)}</Link>,
        },
        {
            title: t('table.emailColumn'),
            dataIndex: 'email',
            key: 'email',
            sorter: true,
            sortOrder: toColumnSortOrder(sort, 'email'),
        },
        {
            title: t('table.roleColumn'),
            key: 'role',
            render: (_, user) => user.role.name,
        },
        {
            title: t('table.statusColumn'),
            key: 'status',
            render: (_, user) => <UserStatusTag status={user.status} />,
        },
        {
            title: t('table.createdColumn'),
            key: 'createdAt',
            sorter: true,
            sortOrder: toColumnSortOrder(sort, 'createdAt'),
            render: (_, user) => formatDate(user.createdAt),
        },
        {
            title: t('table.actionColumn'),
            key: 'action',
            render: (_, user) => (
                <Flex gap="small">
                    <Button type="link" onClick={() => void navigate(`/users/${user.id}`)}>
                        {t('action.view')}
                    </Button>
                    {canUpdate && (
                        <Button type="link" onClick={() => void navigate(`/users/${user.id}/update`)}>
                            {t('action.edit')}
                        </Button>
                    )}
                </Flex>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title={t('page.paginationTitle')}
                actions={can(RESOURCE_CODE.USER, PERMISSION_CODE.CREATE) && (
                    <Button type="primary" onClick={() => void navigate('/users/create')}>
                        {t('page.inviteUser')}
                    </Button>
                )}
            />

            <Flex gap="middle" wrap className={styles['tb-user-pagination-page__filters']}>
                {/* Submitted on Enter or the search button — not per keystroke. Keyed by the URL value so
                    back/forward navigation resets the box to what the list is actually showing. */}
                <Input.Search
                    key={search}
                    className={styles['tb-user-pagination-page__search']}
                    defaultValue={search}
                    placeholder={t('filter.searchPlaceholder')}
                    aria-label={t('filter.searchPlaceholder')}
                    allowClear
                    onSearch={(value) => updateFilter('search', value.trim())}
                />
                <Select<UserStatus>
                    className={styles['tb-user-pagination-page__status']}
                    value={status}
                    placeholder={t('filter.allStatuses')}
                    aria-label={t('filter.statusLabel')}
                    allowClear
                    options={USER_STATUSES.map((value) => ({ value, label: t(`status.${value}`) }))}
                    onChange={(value) => updateFilter('status', value)}
                />
            </Flex>

            <Table<UserDetailsType>
                rowKey="id"
                columns={columns}
                dataSource={userPage.items}
                loading={userQuery.isFetching}
                scroll={{ x: 'max-content' }}
                onChange={handleTableChange}
                pagination={{
                    current: userPage.page,
                    pageSize: userPage.pageSize,
                    total: userPage.totalItems,
                    showSizeChanger: true,
                    pageSizeOptions: PAGE_SIZE_OPTIONS,
                    onChange: (nextPage, nextPageSize) => {
                        setSearchParams((prev) => {
                            prev.set('page', String(nextPage));
                            prev.set('pageSize', String(nextPageSize));
                            return prev;
                        });
                    },
                }}
            />
        </>
    );
}
