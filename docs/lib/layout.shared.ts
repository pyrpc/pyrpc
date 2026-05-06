import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import type { ReactNode } from 'react';

export const gitConfig = {
    user: 'pyrpc',
    repo: 'pyrpc',
    branch: 'main',
};

export function baseOptions(): BaseLayoutProps {
    return {
        nav: {
            title: 'pyrpc',
            transparentMode: 'top',
        },
        links: [
            {
                text: 'Documentation',
                url: '/docs',
                active: 'nested-url',
            },
            {
                text: 'GitHub',
                url: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
                external: true,
            }
        ],
        githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
        themeSwitch: {
            enabled: true,
        },
    };
}


export interface SharedLayoutProps {
    children: ReactNode;
}
