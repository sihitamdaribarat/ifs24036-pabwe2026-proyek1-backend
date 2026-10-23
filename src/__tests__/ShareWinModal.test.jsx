import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreatePost = vi.fn();

vi.mock('../api/client.js', () => ({
  api: {
    posts: {
      create: (...args) => mockCreatePost(...args),
    },
  },
}));

import ShareWinModal from '../components/ShareWinModal.jsx';

describe('ShareWinModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    habit: { id: 1, title: 'Baca buku', emoji: '📖' },
    streak: 5,
    onPostCreated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(<ShareWinModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when open', () => {
    render(<ShareWinModal {...defaultProps} />);
    expect(screen.getByText('Bagikan Kemenangan Kecil')).toBeInTheDocument();
  });

  it('shows habit info', () => {
    render(<ShareWinModal {...defaultProps} />);
    expect(screen.getByText('Baca buku')).toBeInTheDocument();
    expect(screen.getAllByText(/5 hari/).length).toBeGreaterThanOrEqual(1);
  });

  it('pre-fills message with habit info', () => {
    render(<ShareWinModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Ceritakan/);
    expect(textarea.value).toContain('baca buku');
    expect(textarea.value).toContain('5 hari');
  });

  it('allows editing the message', () => {
    render(<ShareWinModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Ceritakan/);
    fireEvent.change(textarea, { target: { value: 'Custom message!' } });
    expect(textarea.value).toBe('Custom message!');
  });

  it('shows post type buttons', () => {
    render(<ShareWinModal {...defaultProps} />);
    expect(screen.getByText(/Daily Win/)).toBeInTheDocument();
    expect(screen.getByText(/Refleksi/)).toBeInTheDocument();
  });

  it('calls onClose when cancel button clicked', () => {
    render(<ShareWinModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Nanti Saja'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('submits post and calls onPostCreated', async () => {
    const mockPost = { id: 1, body: 'Test' };
    mockCreatePost.mockResolvedValueOnce({ data: { post: mockPost } });

    render(<ShareWinModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Bagikan'));

    await waitFor(() => {
      expect(mockCreatePost).toHaveBeenCalledWith(
        expect.objectContaining({
          post_type: 'daily_win',
          habit_id: 1,
        })
      );
    });

    await waitFor(() => {
      expect(defaultProps.onPostCreated).toHaveBeenCalledWith(mockPost);
    });
  });

  it('shows error on submit failure', async () => {
    mockCreatePost.mockRejectedValueOnce(new Error('Network Error'));

    render(<ShareWinModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Bagikan'));

    await waitFor(() => {
      expect(screen.getByText(/Network Error/)).toBeInTheDocument();
    });
  });

  it('shows character counter', () => {
    render(<ShareWinModal {...defaultProps} />);
    expect(screen.getByText(/\/ 500 karakter/)).toBeInTheDocument();
  });

  it('renders without habit info', () => {
    render(<ShareWinModal {...defaultProps} habit={null} streak={null} />);
    expect(screen.getByText('Bagikan Kemenangan Kecil')).toBeInTheDocument();
  });
});
