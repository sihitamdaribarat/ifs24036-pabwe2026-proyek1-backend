import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProfilePage from '../pages/ProfilePage.jsx';
import { api } from '../api/client.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../api/client.js', () => ({
  api: {
    users: {
      getProfile: vi.fn(),
    },
    posts: {
      list: vi.fn(),
    },
  },
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (username = 'johndoe') => {
    return render(
      <MemoryRouter initialEntries={[`/users/${username}`]}>
        <Routes>
          <Route path="/users/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading then user profile data', async () => {
    api.users.getProfile.mockResolvedValueOnce({
      data: {
        user: {
          display_name: 'John Doe',
          username: 'johndoe',
          bio: 'Consistency enthusiast',
          created_at: '2026-01-01T00:00:00Z',
          timezone: 'Asia/Jakarta',
        },
        habits: [
          {
            id: 1,
            title: 'Lari 1km',
            emoji: '🏃',
            color: '#10B981',
            anchor_cue: 'Pagi hari',
            streak: { current_streak: 10 },
          },
        ],
      },
    });

    api.posts.list.mockResolvedValueOnce({
      data: {
        posts: [
          {
            id: 50,
            post_type: 'daily_win',
            created_at: '2026-10-20T10:00:00Z',
            body: 'Sudah lari pagi ini!',
            reaction_count: 5,
            comment_count: 2,
          },
        ],
      },
    });

    renderComponent();

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johndoe')).toBeInTheDocument();
    expect(screen.getByText('Consistency enthusiast')).toBeInTheDocument();
    expect(screen.getByText('Lari 1km')).toBeInTheDocument();
    expect(screen.getByText('Sudah lari pagi ini!')).toBeInTheDocument();
  });

  it('handles error when user is not found', async () => {
    api.users.getProfile.mockRejectedValueOnce(new Error('User not found'));
    api.posts.list.mockResolvedValueOnce({ data: { posts: [] } });

    renderComponent('unknown');

    expect(await screen.findByText('User not found')).toBeInTheDocument();

    const backBtn = screen.getByText('Kembali');
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
