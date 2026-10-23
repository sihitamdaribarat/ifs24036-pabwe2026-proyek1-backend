import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from '../pages/SettingsPage.jsx';
import { api } from '../api/client.js';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUpdateUser = vi.fn();
const mockLogout = vi.fn();

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: {
      username: 'budi_setiawan',
      email: 'budi@example.com',
      display_name: 'Budi Setiawan',
      bio: 'Belajar disiplin tiap hari',
      timezone: 'Asia/Jakarta',
    },
    updateUser: mockUpdateUser,
    logout: mockLogout,
  }),
}));

vi.mock('../api/client.js', () => ({
  api: {
    auth: {
      updateMe: vi.fn(),
    },
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with current user values', () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Pengaturan Profil')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Budi Setiawan')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Belajar disiplin tiap hari')).toBeInTheDocument();
    expect(screen.getByText('@budi_setiawan')).toBeInTheDocument();
  });

  it('handles updating profile settings successfully', async () => {
    api.auth.updateMe.mockResolvedValueOnce({
      data: {
        user: {
          username: 'budi_setiawan',
          display_name: 'Budi S.',
          bio: 'Atomic habits!',
          timezone: 'Asia/Makassar',
        },
      },
    });

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByDisplayValue('Budi Setiawan'), {
      target: { value: 'Budi S.' },
    });
    fireEvent.change(screen.getByDisplayValue('Belajar disiplin tiap hari'), {
      target: { value: 'Atomic habits!' },
    });

    const submitBtn = screen.getByText('Simpan Pengaturan');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.auth.updateMe).toHaveBeenCalledWith({
        display_name: 'Budi S.',
        bio: 'Atomic habits!',
        timezone: 'Asia/Jakarta',
      });
      expect(mockUpdateUser).toHaveBeenCalled();
      expect(screen.getByText('Profil berhasil diperbarui!')).toBeInTheDocument();
    });
  });

  it('handles update profile error', async () => {
    api.auth.updateMe.mockRejectedValueOnce(new Error('Gagal simpan'));

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const submitBtn = screen.getByText('Simpan Pengaturan');
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Gagal simpan')).toBeInTheDocument();
  });

  it('handles logout and navigates to login', async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    const logoutBtn = screen.getByText('Keluar');
    fireEvent.click(logoutBtn);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
