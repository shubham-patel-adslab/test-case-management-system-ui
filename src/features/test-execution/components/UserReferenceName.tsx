import type { UserReferenceType } from '../../user/user.type';
import { formatFullName } from '../../../shared/format/name.format';

const EMPTY_VALUE = '—';

type UserReferenceNameProps = {
    user: UserReferenceType | null;
    // Shown when there's no user (e.g. "Unassigned"); a dash by default.
    fallback?: string;
};

// A person on an execution (assignee, executor, actor): their name, or the fallback.
export function UserReferenceName({ user, fallback = EMPTY_VALUE }: UserReferenceNameProps) {
    return <>{user ? formatFullName(user.firstName, user.lastName) : fallback}</>;
}
