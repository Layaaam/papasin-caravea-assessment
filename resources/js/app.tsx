import { StrictMode } from 'react';
import { createInertiaApp } from '@inertiajs/react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

const pages = import.meta.glob<{ default: ComponentType }>(['./pages/**/*.tsx', '!./pages/**/*.test.tsx']);

void createInertiaApp({
    title: (title) => (title ? `${title} — Expense Tracker` : 'Expense Tracker'),
    resolve: (name) => {
        const page = pages[`./pages/${name}.tsx`];

        if (!page) {
            throw new Error(`Unable to find the Inertia page: ${name}`);
        }

        return page().then((module) => module.default);
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <StrictMode>
                <App {...props} />
            </StrictMode>,
        );
    },
    progress: {
        color: '#1d4ed8',
    },
});
