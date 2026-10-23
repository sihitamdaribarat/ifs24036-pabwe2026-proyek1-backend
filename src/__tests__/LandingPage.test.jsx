import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
  }),
}));

import LandingPage from '../pages/LandingPage.jsx';

describe('LandingPage', () => {
  const renderPage = () =>
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    );

  it('renders the brand name', () => {
    renderPage();
    expect(screen.getByText('LangkahKecil')).toBeInTheDocument();
  });

  it('renders the hero heading', () => {
    renderPage();
    expect(screen.getByText(/Perubahan besar lahir dari/)).toBeInTheDocument();
    expect(screen.getByText(/aksi yang sangat kecil/)).toBeInTheDocument();
  });

  it('renders the hero description', () => {
    renderPage();
    expect(screen.getByText(/Jangan mulai dengan target yang membebani/)).toBeInTheDocument();
  });

  it('shows login and register links when user is not logged in', () => {
    renderPage();
    expect(screen.getByText('Masuk')).toBeInTheDocument();
    expect(screen.getByText('Mulai Gratis')).toBeInTheDocument();
  });

  it('shows CTA button for unauthenticated user', () => {
    renderPage();
    expect(screen.getByText('Mulai Langkah Pertama')).toBeInTheDocument();
  });

  it('renders the feature section', () => {
    renderPage();
    expect(screen.getByText('Mengapa LangkahKecil Berhasil?')).toBeInTheDocument();
  });

  it('renders three feature cards', () => {
    renderPage();
    expect(screen.getByText('Mikro by Design')).toBeInTheDocument();
    expect(screen.getByText(/Streak yang Jujur/)).toBeInTheDocument();
    expect(screen.getByText('Komunitas yang Suportif')).toBeInTheDocument();
  });

  it('renders the preview mockup card', () => {
    renderPage();
    expect(screen.getByText('Fokus Langkah Mikro')).toBeInTheDocument();
    expect(screen.getByText('Baca 1 Halaman Buku')).toBeInTheDocument();
    expect(screen.getByText('Push-up 3 Kali')).toBeInTheDocument();
  });

  it('renders footer', () => {
    renderPage();
    expect(screen.getByText(/© 2026 LangkahKecil/)).toBeInTheDocument();
  });

  it('renders philosophy link', () => {
    renderPage();
    expect(screen.getByText('Pelajari Filosofinya')).toBeInTheDocument();
  });
});

describe('LandingPage - Authenticated User', () => {
  it('shows dashboard link when user is logged in', async () => {
    // Reset modules to re-mock with authenticated user
    vi.resetModules();

    vi.doMock('../context/AuthContext.jsx', () => ({
      useAuth: () => ({
        user: { id: 1, username: 'testuser', display_name: 'Test User' },
        loading: false,
      }),
    }));

    const { default: LandingPageAuth } = await import('../pages/LandingPage.jsx');

    render(
      <MemoryRouter>
        <LandingPageAuth />
      </MemoryRouter>
    );

    expect(screen.getByText('Buka Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Lanjutkan Hari Ini')).toBeInTheDocument();
  });
});
