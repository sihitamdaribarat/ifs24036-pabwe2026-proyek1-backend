import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HabitsPage from '../pages/HabitsPage.jsx';
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
    habits: {
      list: vi.fn(),
      restore: vi.fn(),
    },
  },
}));

describe('HabitsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state then empty state for active habits', async () => {
    api.habits.list.mockResolvedValueOnce({ data: { habits: [] } });

    render(
      <MemoryRouter>
        <HabitsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Kebiasaan Saya')).toBeInTheDocument();
    expect(await screen.findByText('Belum Ada Kebiasaan Aktif')).toBeInTheDocument();
  });

  it('navigates to /habits/new on clicking Tambah button or Buat Sekarang button', async () => {
    api.habits.list.mockResolvedValueOnce({ data: { habits: [] } });

    render(
      <MemoryRouter>
        <HabitsPage />
      </MemoryRouter>
    );

    const addBtn = await screen.findByText('Tambah');
    fireEvent.click(addBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/habits/new');

    const createNowBtn = screen.getByText('Buat Sekarang');
    fireEvent.click(createNowBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/habits/new');
  });

  it('renders active habits list and handles click navigation', async () => {
    api.habits.list.mockResolvedValueOnce({
      data: {
        habits: [
          {
            id: 1,
            title: 'Minum 2L air',
            emoji: '💧',
            color: '#0EA5E9',
            anchor_cue: 'Setelah bangun pagi',
            streak: { current_streak: 3, longest_streak: 7 },
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <HabitsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Minum 2L air')).toBeInTheDocument();
    expect(screen.getByText('Setelah bangun pagi')).toBeInTheDocument();
    expect(screen.getByText('3 hari aktif')).toBeInTheDocument();
    expect(screen.getByText('Rekor: 7 hari')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Minum 2L air'));
    expect(mockNavigate).toHaveBeenCalledWith('/habits/1');
  });

  it('switches to archived tab and renders archived habits', async () => {
    api.habits.list
      .mockResolvedValueOnce({ data: { habits: [] } })
      .mockResolvedValueOnce({
        data: {
          habits: [
            {
              id: 2,
              title: 'Jogging pagi',
              emoji: '🏃',
              color: '#10B981',
              streak: { current_streak: 0, longest_streak: 5 },
            },
          ],
        },
      });

    render(
      <MemoryRouter>
        <HabitsPage />
      </MemoryRouter>
    );

    await screen.findByText('Belum Ada Kebiasaan Aktif');

    const archiveTab = screen.getByText('Diarsipkan');
    fireEvent.click(archiveTab);

    expect(await screen.findByText('Jogging pagi')).toBeInTheDocument();
    expect(screen.getByText('Pulihkan')).toBeInTheDocument();
  });

  it('handles restore habit in archived tab', async () => {
    api.habits.list
      .mockResolvedValueOnce({ data: { habits: [] } })
      .mockResolvedValueOnce({
        data: {
          habits: [
            {
              id: 2,
              title: 'Jogging pagi',
              emoji: '🏃',
              color: '#10B981',
            },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { habits: [] } });

    api.habits.restore.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <HabitsPage />
      </MemoryRouter>
    );

    await screen.findByText('Belum Ada Kebiasaan Aktif');
    fireEvent.click(screen.getByText('Diarsipkan'));

    const restoreBtn = await screen.findByText('Pulihkan');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(api.habits.restore).toHaveBeenCalledWith(2);
    });
  });

  it('handles restore error alert', async () => {
    const originalAlert = window.alert;
    window.alert = vi.fn();

    api.habits.list
      .mockResolvedValueOnce({ data: { habits: [] } })
      .mockResolvedValueOnce({
        data: {
          habits: [{ id: 9, title: 'Old habit', emoji: '🌱', color: '#10B981' }],
        },
      });

    api.habits.restore.mockRejectedValueOnce(new Error('Limit reached'));

    render(
      <MemoryRouter>
        <HabitsPage />
      </MemoryRouter>
    );

    await screen.findByText('Belum Ada Kebiasaan Aktif');
    fireEvent.click(screen.getByText('Diarsipkan'));

    const restoreBtn = await screen.findByText('Pulihkan');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Limit reached');
    });

    window.alert = originalAlert;
  });
});
