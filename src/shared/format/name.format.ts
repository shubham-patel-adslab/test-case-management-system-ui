// "First Last", or just "First" when the last name is empty (it's optional).
export function formatFullName(firstName: string, lastName: string | null): string {
    return [firstName, lastName].filter(Boolean).join(' ');
}
