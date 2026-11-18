import { App as AntdApp } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { AuthProvider } from '../features/auth/components/AuthProvider';
import { ThemeProvider } from '../shared/theme';

const MAX_QUERY_RETRIES = 2;

// ui-requirements §6.4 / §7: no UI caching (staleTime stays at its default of 0, so every screen asks
// the backend), and GETs retry only on network/5xx errors — a 4xx (404, 403…) won't succeed on retry,
// it only delays the error state.
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => {
                const isClientError = isAxiosError(error) && error.response !== undefined && error.response.status < 500;
                return !isClientError && failureCount < MAX_QUERY_RETRIES;
            },
        },
    },
});

type AppProvidersProps = {
    children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <AntdApp>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </AntdApp>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
