import { App as AntdApp, ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

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
                    {children}
                </AntdApp>
            </ConfigProvider>
        </QueryClientProvider>
    );
}
