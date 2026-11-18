// GET /analytics. `from` / `to`: inclusive calendar days (YYYY-MM-DD) in `timeZone` (IANA name). Without
// `projectId` it covers every project the caller may read (the dashboard's default); with it, that one project.
export type AnalyticsRequestDto = {
    from: string;
    to: string;
    timeZone: string;
    projectId?: number;
};
