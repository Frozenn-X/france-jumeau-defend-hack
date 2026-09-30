import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProjectFooter from './ProjectFooter';

describe('ProjectFooter', () => {
  it('expose un lien sûr vers la présentation de son auteur', () => {
    render(<ProjectFooter />);

    const link = screen.getByRole('link', { name: /fait par xavier trauchessec.*en savoir plus/i });
    expect(link).toHaveAttribute('href', 'https://xavier.trauchessec.fr');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
