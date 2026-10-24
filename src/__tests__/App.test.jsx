import React, { lazy } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockAuthState = {
  user: null,
  loading: false,
};

// Mock AuthContext
vi.mock('../context/AuthContext.jsx', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => mockAuthState,
}));

// Mock Layout
vi.mock('../components/Layout.jsx', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

import App, { ProtectedRoute, PublicOnlyRoute } from '../App.jsx';

describe('App & Route Guards', () => {
  beforeEach(() => {
    mockAuthState = {
      user: null,
      loading: false,
    };
  });

  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('renders landing page content on root route', () => {
    render(<App />);
    expect(screen.getByText('LangkahKecil')).toBeInTheDocument();
  });

  it('renders Mulai Gratis link for unauthenticated users', () => {
    render(<App />);
    expect(screen.getByText('Mulai Gratis')).toBeInTheDocument();
  });

  describe('ProtectedRoute', () => {
    it('shows loading spinner when loading is true', () => {
      mockAuthState = { user: null, loading: true };
      const { container } = render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('redirects to /login when user is not authenticated', () => {
      mockAuthState = { user: null, loading: false };
      render(
        <MemoryRouter initialEntries={['/secret']}>
          <Routes>
            <Route
              path="/secret"
              element={
                <ProtectedRoute>
                  <div>Secret Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Login Page')).toBeInTheDocument();
      expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    });

    it('renders layout and children when user is authenticated', () => {
      mockAuthState = { user: { id: 1, email: 'test@example.com' }, loading: false };
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <div>Secret Content</div>
          </ProtectedRoute>
        </MemoryRouter>
      );
      expect(screen.getByTestId('layout')).toBeInTheDocument();
      expect(screen.getByText('Secret Content')).toBeInTheDocument();
    });

    it('shows a page spinner while a lazy page is loading', async () => {
      mockAuthState = { user: { id: 1, email: 'test@example.com' }, loading: false };
      const LazyPage = lazy(() => Promise.resolve({ default: () => <div>Lazy Content</div> }));
      render(
        <MemoryRouter>
          <ProtectedRoute>
            <LazyPage />
          </ProtectedRoute>
        </MemoryRouter>
      );
      expect(screen.getByLabelText('Memuat halaman')).toBeInTheDocument();
      expect(await screen.findByText('Lazy Content')).toBeInTheDocument();
    });
  });

  describe('PublicOnlyRoute', () => {
    it('shows loading spinner when loading is true', () => {
      mockAuthState = { user: null, loading: true };
      const { container } = render(
        <MemoryRouter>
          <PublicOnlyRoute>
            <div>Public Content</div>
          </PublicOnlyRoute>
        </MemoryRouter>
      );
      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
      expect(screen.queryByText('Public Content')).not.toBeInTheDocument();
    });

    it('redirects to /today when user is already authenticated', () => {
      mockAuthState = { user: { id: 1, email: 'test@example.com' }, loading: false };
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <div>Login Form</div>
                </PublicOnlyRoute>
              }
            />
            <Route path="/today" element={<div>Today Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByText('Today Dashboard')).toBeInTheDocument();
      expect(screen.queryByText('Login Form')).not.toBeInTheDocument();
    });

    it('renders children when user is not authenticated', () => {
      mockAuthState = { user: null, loading: false };
      render(
        <MemoryRouter>
          <PublicOnlyRoute>
            <div>Public Form</div>
          </PublicOnlyRoute>
        </MemoryRouter>
      );
      expect(screen.getByText('Public Form')).toBeInTheDocument();
    });
  });
});
