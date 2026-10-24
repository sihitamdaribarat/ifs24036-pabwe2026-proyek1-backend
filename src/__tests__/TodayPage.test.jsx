import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import TodayPage from '../pages/TodayPage.jsx';
import { api } from '../api/client.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 1, display_name: 'Budi' },
  }),
}));

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

vi.mock('../api/client.js', () => ({
  api: {
    habits: {
      today: vi.fn(),
    },
    logs: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('TodayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially and then empty habits state', async () => {
    api.habits.today.mockResolvedValueOnce({
      data: {
        date: '2026-10-23',
        progress: { total: 0, completed: 0, percentage: 0 },
        habits: [],
      },
    });

    render(
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Budi/)).toBeInTheDocument();
    expect(screen.getByText('Belum Ada Kebiasaan')).toBeInTheDocument();

    const createBtn = screen.getByText('Buat Kebiasaan Pertama');
    fireEvent.click(createBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/habits/new');
  });

  it('renders habits and completes a check-in', async () => {
    api.habits.today.mockResolvedValueOnce({
      data: {
        date: '2026-10-23',
        progress: { total: 1, completed: 0, percentage: 0 },
        habits: [
          {
            id: 10,
            title: 'Minum Air 500ml',
            emoji: '💧',
            color: '#0EA5E9',
            completed_today: false,
            streak: { current_streak: 2 },
          },
        ],
      },
    });

    api.logs.create.mockResolvedValueOnce({
      data: { streak: { current_streak: 3 } },
    });

    render(
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Minum Air 500ml')).toBeInTheDocument();

    const checkBtn = screen.getByTitle('Centang selesai');
    fireEvent.click(checkBtn);

    await waitFor(() => {
      expect(api.logs.create).toHaveBeenCalledWith(10);
      expect(screen.getByText('Bagikan Kemenangan Kecil')).toBeInTheDocument();
    });
  });

  it('undoes a check-in when already completed', async () => {
    api.habits.today.mockResolvedValueOnce({
      data: {
        date: '2026-10-23',
        progress: { total: 1, completed: 1, percentage: 100 },
        habits: [
          {
            id: 11,
            title: 'Push-up 5x',
            emoji: '💪',
            color: '#10B981',
            completed_today: true,
            streak: { current_streak: 5 },
          },
        ],
      },
    });

    api.logs.delete.mockResolvedValueOnce({
      data: { streak: { current_streak: 4 } },
    });

    render(
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Push-up 5x')).toBeInTheDocument();

    const undoBtn = screen.getByTitle('Batalkan check-in');
    fireEvent.click(undoBtn);

    await waitFor(() => {
      expect(api.logs.delete).toHaveBeenCalledWith(11, '2026-10-23');
    });
  });

  it('navigates to habit detail when habit card clicked', async () => {
    api.habits.today.mockResolvedValueOnce({
      data: {
        date: '2026-10-23',
        progress: { total: 1, completed: 0, percentage: 0 },
        habits: [
          {
            id: 12,
            title: 'Baca 1 Lembar',
            emoji: '📖',
            color: '#6366F1',
            completed_today: false,
            anchor_cue: 'Setelah sarapan',
            streak: { current_streak: 1 },
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Baca 1 Lembar')).toBeInTheDocument();

    expect(screen.getByText('Baca 1 Lembar').closest('a')).toHaveAttribute('href', '/habits/12');
  });
});
