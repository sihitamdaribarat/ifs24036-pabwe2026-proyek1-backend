import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock the AuthContext
vi.mock('../context/AuthContext.jsx', () => ({
  AuthProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

import App from '../App.jsx';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('renders landing page content on root route', () => {
    render(<App />);
    // App uses BrowserRouter internally, and default route is /
    // which shows LandingPage
    expect(screen.getByText('LangkahKecil')).toBeInTheDocument();
  });

  it('renders Mulai Gratis link for unauthenticated users', () => {
    render(<App />);
    expect(screen.getByText('Mulai Gratis')).toBeInTheDocument();
  });
});
