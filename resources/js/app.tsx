import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app-root';

const rootElement = document.getElementById('app');

if (rootElement === null) {
    throw new Error('Unable to find the React mount element.');
}

createRoot(rootElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
