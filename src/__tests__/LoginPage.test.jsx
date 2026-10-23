import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockLogin = vi.fn();
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
    login: mockLogin,
  }),
}));

import LoginPage from '../pages/LoginPage.jsx';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

  it('renders the login form', () => {
    renderPage();
    expect(screen.getByPlaceholderText('nama@email.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
  });

  it('renders the login heading', () => {
    renderPage();
    expect(screen.getByText('Selamat Datang Kembali')).toBeInTheDocument();
  });

  it('renders the register link', () => {
    renderPage();
    expect(screen.getByText('Daftar Sekarang')).toBeInTheDocument();
  });

  it('allows typing in email field', () => {
    renderPage();
    const emailInput = screen.getByPlaceholderText('nama@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  it('allows typing in password field', () => {
    renderPage();
    const passwordInput = screen.getByPlaceholderText('••••••••');
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });
    expect(passwordInput.value).toBe('mypassword');
  });

  it('calls login on form submit', async () => {
    mockLogin.mockResolvedValueOnce({ id: 1, username: 'test' });
    renderPage();

    const emailInput = screen.getByPlaceholderText('nama@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const submitButton = screen.getByText('Masuk ke Akun');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Email atau password salah.'));
    renderPage();

    const emailInput = screen.getByPlaceholderText('nama@email.com');
    const passwordInput = screen.getByPlaceholderText('••••••••');

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    const submitButton = screen.getByText('Masuk ke Akun');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Email atau password salah.')).toBeInTheDocument();
    });
  });

  it('shows brand name LangkahKecil', () => {
    renderPage();
    expect(screen.getByText('LangkahKecil')).toBeInTheDocument();
  });

  it('shows description text', () => {
    renderPage();
    expect(screen.getByText('Masuk untuk mencatat kebiasaan harianmu')).toBeInTheDocument();
  });
});
