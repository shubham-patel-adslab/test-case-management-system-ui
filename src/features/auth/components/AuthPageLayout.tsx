import { Card, Typography } from 'antd';

import styles from './AuthPageLayout.module.scss';

type AuthPageLayoutProps = {
    title: string;
    // Shown between the title and the content (e.g. a server error).
    alert?: React.ReactNode;
    children: React.ReactNode;
};

// Centered card for the public account pages (sign-in, set-password), which render outside AppLayout.
export function AuthPageLayout({ title, alert, children }: AuthPageLayoutProps) {
    return (
        <main className={styles['tb-auth-page']}>
            <Card className={styles['tb-auth-page__card']}>
                <Typography.Title level={3} className={styles['tb-auth-page__title']}>{title}</Typography.Title>
                {alert && <div className={styles['tb-auth-page__alert']}>{alert}</div>}
                {children}
            </Card>
        </main>
    );
}
