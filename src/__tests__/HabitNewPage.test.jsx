import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import HabitNewPage from '../pages/HabitNewPage.jsx';
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
      create: vi.fn(),
    },
  },
}));

describe('HabitNewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with default state', () => {
    render(
      <MemoryRouter>
        <HabitNewPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Buat Kebiasaan Mikro')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Buat sekecil mungkin/)).toBeInTheDocument();
    expect(screen.getByText('Simpan Kebiasaan')).toBeInTheDocument();
  });

  it('navigates back when back button clicked', () => {
    render(
      <MemoryRouter>
        <HabitNewPage />
      </MemoryRouter>
    );

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('allows changing emoji and color', () => {
    render(
      <MemoryRouter>
        <HabitNewPage />
      </MemoryRouter>
    );

    // Click an emoji button
    const bookEmoji = screen.getByRole('button', { name: '📖' });
    fireEvent.click(bookEmoji);

    // Click color buttons
    const buttons = screen.getAllByRole('button');
    // There are color buttons
    const colorBtn = buttons.find((b) => b.getAttribute('style')?.includes('#6366F1'));
    if (colorBtn) fireEvent.click(colorBtn);
  });

  it('creates habit and navigates to /today on success', async () => {
    api.habits.create.mockResolvedValueOnce({ data: { habit: { id: 1 } } });

    render(
      <MemoryRouter>
        <HabitNewPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Buat sekecil mungkin/), {
      target: { value: 'Minum 1 gelas air' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Setelah menyikat gigi/), {
      target: { value: 'Setelah bangun tidur' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Mengembangkan wawasan/), {
      target: { value: 'Untuk hidrasi tubuh' },
    });

    const submitBtn = screen.getByText('Simpan Kebiasaan');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.habits.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Minum 1 gelas air',
          anchor_cue: 'Setelah bangun tidur',
          description: 'Untuk hidrasi tubuh',
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/today');
    });
  });

  it('handles HABIT_LIMIT_REACHED error', async () => {
    api.habits.create.mockRejectedValueOnce({
      code: 'HABIT_LIMIT_REACHED',
    });

    render(
      <MemoryRouter>
        <HabitNewPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Buat sekecil mungkin/), {
      target: { value: 'Latihan napas' },
    });

    fireEvent.click(screen.getByText('Simpan Kebiasaan'));

    expect(
      await screen.findByText(/Maksimal 10 kebiasaan aktif tercapai/)
    ).toBeInTheDocument();
  });

  it('handles validation details error', async () => {
    api.habits.create.mockRejectedValueOnce({
      details: [{ message: 'Judul minimal 3 karakter' }],
    });

    render(
      <MemoryRouter>
        <HabitNewPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Buat sekecil mungkin/), {
      target: { value: 'AB' },
    });

    fireEvent.click(screen.getByText('Simpan Kebiasaan'));

    expect(await screen.findByText('Judul minimal 3 karakter')).toBeInTheDocument();
  });

  it('handles generic error message', async () => {
    api.habits.create.mockRejectedValueOnce(new Error('Server error'));

    render(
      <MemoryRouter>
        <HabitNewPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Buat sekecil mungkin/), {
      target: { value: 'Meditasi' },
    });

    fireEvent.click(screen.getByText('Simpan Kebiasaan'));

    expect(await screen.findByText('Server error')).toBeInTheDocument();
  });
});
