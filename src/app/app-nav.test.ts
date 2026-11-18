import { describe, expect, it } from 'vitest';

import { getProjectNavItems, NAV_ITEMS, PROJECT_SWITCH_TARGETS } from './app-nav';
import { findSelectedKey } from '../shared/components/layout/AppSidebar/nav-selection';

// The sidebar as the app builds it: the main items plus the current project's section.
const PROJECT_ID = 7;
const sidebarItems = [...NAV_ITEMS, ...getProjectNavItems(PROJECT_ID)];
const selectedFor = (pathname: string) => findSelectedKey(sidebarItems, pathname);

describe('sidebar highlight', () => {
    it('highlights Test suites on a suite run report, whose URL is outside /test-suites', () => {
        expect(selectedFor('/projects/7/suite-runs/42')).toBe('test-suites');
    });

    it('highlights the section that owns the page', () => {
        expect(selectedFor('/projects/7')).toBe('project-overview');
        expect(selectedFor('/projects/7/update')).toBe('project-overview');
        expect(selectedFor('/projects/7/test-suites')).toBe('test-suites');
        expect(selectedFor('/projects/7/test-suites/3')).toBe('test-suites');
        expect(selectedFor('/projects/7/test-cases/5/execute')).toBe('test-cases');
        expect(selectedFor('/projects/7/executions/9')).toBe('executions');
    });

    it('matches whole path segments only', () => {
        expect(selectedFor('/projects/7/suite-runs-archive')).toBe('project-overview');
        expect(selectedFor('/projects-old')).toBeUndefined();
    });

    it('keeps the main items for pages outside a project', () => {
        expect(selectedFor('/dashboard')).toBe('dashboard');
        expect(selectedFor('/projects')).toBe('projects');
        expect(selectedFor('/users/abc')).toBe('users');
    });
});

describe('project switch targets', () => {
    it('sends a suite run report to the other project\'s test suites, other sections to their own list', () => {
        expect(PROJECT_SWITCH_TARGETS.get('suite-runs')).toBe('test-suites');
        expect(PROJECT_SWITCH_TARGETS.get('test-suites')).toBe('test-suites');
        expect(PROJECT_SWITCH_TARGETS.get('test-cases')).toBe('test-cases');
        expect(PROJECT_SWITCH_TARGETS.has('update')).toBe(false);
    });
});
