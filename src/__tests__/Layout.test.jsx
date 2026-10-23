import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'testuser', display_name: 'Test User' },
    logout: mockLogout,
  }),
}));

import Layout from '../components/Layout.jsx';

describe('Layout', () => {
  const renderLayout = (initialRoute = '/today') =>
    render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Layout>
          <div data-testid="child-content">Hello Content</div>
        </Layout>
      </MemoryRouter>
    );

  it('renders children content', () => {
    renderLayout();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Hello Content')).toBeInTheDocument();
  });

  it('renders brand name LangkahKecil', () => {
    renderLayout();
    const brandElements = screen.getAllByText('LangkahKecil');
    expect(brandElements.length).toBeGreaterThan(0);
  });

  it('renders navigation items', () => {
    renderLayout();
    const hariIniItems = screen.getAllByText('Hari Ini');
    expect(hariIniItems.length).toBeGreaterThan(0);
    const kebiasaanItems = screen.getAllByText('Kebiasaan');
    expect(kebiasaanItems.length).toBeGreaterThan(0);
    const komunitasItems = screen.getAllByText('Komunitas');
    expect(komunitasItems.length).toBeGreaterThan(0);
    const profilItems = screen.getAllByText('Profil');
    expect(profilItems.length).toBeGreaterThan(0);
  });

  it('renders create habit button', () => {
    renderLayout();
    expect(screen.getByText('Buat Kebiasaan')).toBeInTheDocument();
  });

  it('renders user info', () => {
    renderLayout();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('@testuser')).toBeInTheDocument();
  });

  it('renders user initial avatar', () => {
    renderLayout();
    const avatarElements = screen.getAllByText('T');
    expect(avatarElements.length).toBeGreaterThan(0);
  });

  it('navigates to new habit page when create button clicked', () => {
    renderLayout();
    fireEvent.click(screen.getByText('Buat Kebiasaan'));
    expect(mockNavigate).toHaveBeenCalledWith('/habits/new');
  });
});
