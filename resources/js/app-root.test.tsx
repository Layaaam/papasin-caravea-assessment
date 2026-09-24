import { render, screen } from '@testing-library/react';

import { App } from '@/app-root';

describe('App', () => {
    it('renders the frontend foundation status', () => {
        render(<App />);

        expect(screen.getByRole('heading', { name: 'Frontend foundation is ready' })).toBeInTheDocument();
    });
});
