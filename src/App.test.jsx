import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./Utils/Basic', () => ({
  fetchGames: vi.fn().mockResolvedValue([]),
}));

describe('App', () => {
  it('renders the home screen at "/"', () => {
    render(<App />);
    expect(screen.getByText(/pick a game/i)).toBeInTheDocument();
  });
});
