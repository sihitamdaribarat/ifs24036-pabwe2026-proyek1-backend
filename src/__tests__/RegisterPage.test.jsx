import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockRegister = vi.fn();
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
    user: null,
    loading: false,
    register: mockRegister,
  }),
}));

import RegisterPage from '../pages/RegisterPage.jsx';

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

  it('renders the registration form', () => {
    renderPage();
    expect(screen.getByPlaceholderText(/Contoh: Dinda/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/contoh: dinda_baca/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nama@email.com/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Minimal 8 karakter/)).toBeInTheDocument();
  });

  it('renders the heading', () => {
    renderPage();
    expect(screen.getByText('Mulai Langkah Pertamamu')).toBeInTheDocument();
  });

  it('renders the login link', () => {
    renderPage();
    expect(screen.getByText('Masuk')).toBeInTheDocument();
  });

  it('shows register button', () => {
    renderPage();
    expect(screen.getByText('Daftar Sekarang')).toBeInTheDocument();
  });

  it('allows typing in form fields', () => {
    renderPage();
    const nameInput = screen.getByPlaceholderText(/Contoh: Dinda/);
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    expect(nameInput.value).toBe('Test User');
  });

  it('calls register on form submit', async () => {
    mockRegister.mockResolvedValueOnce({ id: 1, username: 'testuser' });
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/Contoh: Dinda/), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByPlaceholderText(/contoh: dinda_baca/), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText(/nama@email.com/), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Minimal 8 karakter/), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByText('Daftar Sekarang'));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });
  });

  it('shows error on registration failure', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Username sudah dipakai'));
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/Contoh: Dinda/), {
      target: { value: 'Test' },
    });
    fireEvent.change(screen.getByPlaceholderText(/contoh: dinda_baca/), {
      target: { value: 'existing' },
    });
    fireEvent.change(screen.getByPlaceholderText(/nama@email.com/), {
      target: { value: 'test@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Minimal 8 karakter/), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByText('Daftar Sekarang'));

    await waitFor(() => {
      expect(screen.getByText(/Username sudah dipakai/)).toBeInTheDocument();
    });
  });
});
