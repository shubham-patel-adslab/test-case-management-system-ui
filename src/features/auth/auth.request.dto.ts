export type AuthSignInRequestDto = {
    email: string;
    password: string;
};

// POST /invitations/accept — the token from the emailed link plus the user's first password.
export type InvitationAcceptRequestDto = {
    token: string;
    password: string;
};
