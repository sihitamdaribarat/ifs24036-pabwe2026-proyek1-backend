import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext.jsx';
import { api, setToken, getToken } from '../api/client.js';

vi.mock('../api/client.js', () => ({
  api: {
    auth: {
      getMe: vi.fn(),
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    },
  },
  setToken: vi.fn(),
  getToken: vi.fn(),
}));

function TestConsumer() {
  const { user, loading, login, register, logout, updateUser } = useAuth();

  if (loading) return <div>Loading auth...</div>;
  return (
    <div>
      <div>User: {user ? user.name : 'Guest'}</div>
      <button onClick={() => login('test@example.com', 'password123')}>Login</button>
      <button onClick={() => register({ name: 'New User', email: 'new@example.com', password: 'password123' })}>Register</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => updateUser({ name: 'Updated Name' })}>Update User</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getToken.mockReturnValue(null);
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    const originalError = console.error;
    console.error = vi.fn();
    expect(() => render(<TestConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    console.error = originalError;
  });

  it('loads with null user when no token', async () => {
    getToken.mockReturnValue(null);
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByText('User: Guest')).toBeInTheDocument();
  });

  it('loads user when token is present and getMe succeeds', async () => {
    getToken.mockReturnValue('valid-token');
    api.auth.getMe.mockResolvedValueOnce({ data: { user: { id: 1, name: 'Alice' } } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText('User: Alice')).toBeInTheDocument();
  });

  it('handles getMe failure when token is expired/invalid', async () => {
    getToken.mockReturnValue('expired-token');
    api.auth.getMe.mockRejectedValueOnce(new Error('Unauthorized'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText('User: Guest')).toBeInTheDocument();
    expect(setToken).toHaveBeenCalledWith(null);
  });

  it('handles login successfully', async () => {
    getToken.mockReturnValue(null);
    api.auth.login.mockResolvedValueOnce({
      data: { access_token: 'login-token', user: { id: 2, name: 'Bob' } },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Login').click();
    });

    expect(setToken).toHaveBeenCalledWith('login-token');
    expect(screen.getByText('User: Bob')).toBeInTheDocument();
  });

  it('handles register successfully', async () => {
    getToken.mockReturnValue(null);
    api.auth.register.mockResolvedValueOnce({
      data: { access_token: 'reg-token', user: { id: 3, name: 'Charlie' } },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Register').click();
    });

    expect(setToken).toHaveBeenCalledWith('reg-token');
    expect(screen.getByText('User: Charlie')).toBeInTheDocument();
  });

  it('handles logout successfully', async () => {
    getToken.mockReturnValue('user-token');
    api.auth.getMe.mockResolvedValueOnce({ data: { user: { id: 1, name: 'Alice' } } });
    api.auth.logout.mockResolvedValueOnce({});

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText('User: Alice')).toBeInTheDocument();

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(setToken).toHaveBeenCalledWith(null);
    expect(screen.getByText('User: Guest')).toBeInTheDocument();
  });

  it('handles logout when API fails gracefully', async () => {
    getToken.mockReturnValue(null);
    api.auth.logout.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(setToken).toHaveBeenCalledWith(null);
    expect(screen.getByText('User: Guest')).toBeInTheDocument();
  });

  it('updates user state via updateUser', async () => {
    getToken.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Update User').click();
    });

    expect(screen.getByText('User: Updated Name')).toBeInTheDocument();
  });

  it('resets user on auth:expired event', async () => {
    getToken.mockReturnValue('some-token');
    api.auth.getMe.mockResolvedValueOnce({ data: { user: { id: 1, name: 'Alice' } } });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(await screen.findByText('User: Alice')).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event('auth:expired'));
    });

    expect(screen.getByText('User: Guest')).toBeInTheDocument();
  });
});
