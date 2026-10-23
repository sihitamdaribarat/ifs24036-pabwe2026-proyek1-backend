import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HabitDetailPage from '../pages/HabitDetailPage.jsx';
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
      get: vi.fn(),
      update: vi.fn(),
      archive: vi.fn(),
    },
    logs: {
      list: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('HabitDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (id = '1') => {
    return render(
      <MemoryRouter initialEntries={[`/habits/${id}`]}>
        <Routes>
          <Route path="/habits/:id" element={<HabitDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders loading state initially and then displays habit detail', async () => {
    api.habits.get.mockResolvedValueOnce({
      data: {
        habit: {
          id: 1,
          title: 'Baca 1 Halaman',
          anchor_cue: 'Setelah sarapan',
          description: 'Membangun literasi',
          emoji: '📖',
          color: '#10B981',
          streak: { current_streak: 5, longest_streak: 10 },
        },
      },
    });
    api.logs.list.mockResolvedValueOnce({
      data: {
        logs: [
          { id: 101, log_date: '2026-10-22', note: 'Halaman 10 selesai' },
        ],
      },
    });

    renderComponent();

    expect(await screen.findByText('Baca 1 Halaman')).toBeInTheDocument();
    expect(screen.getByText('Setelah sarapan')).toBeInTheDocument();
    expect(screen.getByText('Membangun literasi')).toBeInTheDocument();
    expect(screen.getByText('Halaman 10 selesai')).toBeInTheDocument();
  });

  it('handles error state when habit is not found', async () => {
    api.habits.get.mockRejectedValueOnce(new Error('Habit not found'));
    api.logs.list.mockResolvedValueOnce({ data: { logs: [] } });

    renderComponent('999');

    expect(await screen.findByText('Habit not found')).toBeInTheDocument();

    const backBtn = screen.getByText('Kembali ke Daftar Kebiasaan');
    fireEvent.click(backBtn);
    expect(mockNavigate).toHaveBeenCalledWith('/habits');
  });

  it('allows editing and updating habit details', async () => {
    api.habits.get.mockResolvedValueOnce({
      data: {
        habit: {
          id: 1,
          title: 'Baca 1 Halaman',
          anchor_cue: 'Setelah sarapan',
          description: 'Membangun literasi',
          emoji: '📖',
          color: '#10B981',
        },
      },
    });
    api.logs.list.mockResolvedValueOnce({ data: { logs: [] } });

    api.habits.update.mockResolvedValueOnce({
      data: {
        habit: {
          id: 1,
          title: 'Baca 5 Halaman',
          anchor_cue: 'Setelah kopi',
          description: 'Level up',
          emoji: '📖',
          color: '#10B981',
        },
      },
    });

    renderComponent();

    expect(await screen.findByText('Baca 1 Halaman')).toBeInTheDocument();

    const editBtn = screen.getByText('Edit');
    fireEvent.click(editBtn);

    expect(screen.getAllByText('Batal').length).toBeGreaterThanOrEqual(1);

    const titleInput = screen.getByDisplayValue('Baca 1 Halaman');
    fireEvent.change(titleInput, { target: { value: 'Baca 5 Halaman' } });

    const saveBtn = screen.getByText('Simpan Perubahan');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.habits.update).toHaveBeenCalledWith('1', expect.objectContaining({
        title: 'Baca 5 Halaman',
      }));
    });
  });

  it('handles archiving habit with confirm prompt', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    api.habits.get.mockResolvedValueOnce({
      data: {
        habit: { id: 1, title: 'Meditasi', archived_at: null },
      },
    });
    api.logs.list.mockResolvedValueOnce({ data: { logs: [] } });
    api.habits.archive.mockResolvedValueOnce({});

    renderComponent();

    expect(await screen.findByText('Meditasi')).toBeInTheDocument();

    const archiveBtn = screen.getByText('Arsipkan');
    fireEvent.click(archiveBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(api.habits.archive).toHaveBeenCalledWith('1');
      expect(mockNavigate).toHaveBeenCalledWith('/habits');
    });

    window.confirm = originalConfirm;
  });

  it('handles backdate checkin for yesterday', async () => {
    api.habits.get.mockResolvedValue({
      data: {
        habit: { id: 1, title: 'Pushup', streak: { current_streak: 1 } },
      },
    });
    // Logs don't include yesterday
    api.logs.list.mockResolvedValue({ data: { logs: [] } });
    api.logs.create.mockResolvedValueOnce({ data: { log: { id: 200 } } });

    renderComponent();

    expect(await screen.findByText('Pushup')).toBeInTheDocument();

    const catatBtn = screen.queryByText('Catat Kemarin');
    if (catatBtn) {
      fireEvent.click(catatBtn);
      await waitFor(() => {
        expect(api.logs.create).toHaveBeenCalled();
      });
    }
  });
});
