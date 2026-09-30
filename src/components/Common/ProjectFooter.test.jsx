import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectFooter from './ProjectFooter';

describe('ProjectFooter', () => {
  it('expose le portfolio de manière sûre dans un nouvel onglet', () => {
    render(<ProjectFooter />);

    const link = screen.getByRole('link', { name: /voir le portfolio/i });
    expect(link).toHaveAttribute('href', 'https://xavier.trauchessec.fr');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
