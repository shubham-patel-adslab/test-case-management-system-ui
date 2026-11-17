import { App as AntdApp, ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { AuthProvider } from '../features/auth/components/AuthProvider';

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

// antd's default Layout tokens pair a dark headerBg with a light-mode headerColor,
// which is unreadable out of the box — this is the app's theme definition, so it's
// the one place a literal color value belongs rather than a token reference.
const theme = {
    components: {
        Layout: {
            headerBg: '#ffffff',
        },
    },
};

type AppProvidersProps = {
    children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <ConfigProvider theme={theme}>
                <AntdApp>
                    <AuthProvider>
                        {children}
                    </AuthProvider>
                </AntdApp>
            </ConfigProvider>
        </QueryClientProvider>
    );
}
