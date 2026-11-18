// The suites of a project as options (test case form, list filter): the API's largest page. Suites are
// few per project; if a project ever has more, the picker shows the first 100 by name.
export const TEST_SUITE_OPTIONS_PAGE_SIZE = 100;

// Same limits as the backend's suite schema.
export const TEST_SUITE_NAME_MAX_LENGTH = 150;
export const TEST_SUITE_DESCRIPTION_MAX_LENGTH = 1000;
// Test cases added in one call; a reorder lists every case of the suite (at most 1000).
export const TEST_SUITE_ADD_CASES_MAX = 100;
export const TEST_SUITE_REORDER_MAX = 1000;

// The "add test cases" picker searches the project's test cases on the server, like the member picker.
export const TEST_SUITE_CASE_PICKER_PAGE_SIZE = 20;
export const TEST_SUITE_CASE_PICKER_DEBOUNCE_MS = 300;
