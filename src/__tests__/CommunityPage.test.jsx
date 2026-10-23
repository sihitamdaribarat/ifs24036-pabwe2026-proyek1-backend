import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CommunityPage from '../pages/CommunityPage.jsx';
import { api } from '../api/client.js';

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: { id: 1, username: 'tester', display_name: 'Tester User' },
  }),
}));

vi.mock('../api/client.js', () => ({
  api: {
    habits: {
      list: vi.fn(),
    },
    posts: {
      list: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      reaction: {
        set: vi.fn(),
        remove: vi.fn(),
      },
      comments: {
        list: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}));

describe('CommunityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly and loads posts and habits', async () => {
    api.habits.list.mockResolvedValueOnce({
      data: { habits: [{ id: 1, title: 'Baca buku' }] },
    });
    api.posts.list.mockResolvedValueOnce({
      data: {
        posts: [
          {
            id: 101,
            author: { id: 1, username: 'tester', display_name: 'Tester User' },
            post_type: 'daily_win',
            created_at: new Date().toISOString(),
            body: 'Menyelesaikan 1 halaman buku!',
            reaction_count: 3,
            comment_count: 1,
            my_reaction: null,
            reactions_summary: { cheer: 3 },
          },
        ],
      },
      meta: { next_cursor: null, has_more: false },
    });

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Komunitas LangkahKecil')).toBeInTheDocument();
    expect(await screen.findByText('Menyelesaikan 1 halaman buku!')).toBeInTheDocument();
    expect(screen.getByText('Tester User')).toBeInTheDocument();
  });

  it('allows creating a post', async () => {
    api.habits.list.mockResolvedValueOnce({
      data: { habits: [{ id: 1, title: 'Baca buku' }] },
    });
    api.posts.list.mockResolvedValueOnce({
      data: { posts: [] },
      meta: { next_cursor: null, has_more: false },
    });

    api.posts.create.mockResolvedValueOnce({
      data: {
        post: {
          id: 102,
          author: { id: 1, username: 'tester', display_name: 'Tester User' },
          post_type: 'daily_win',
          created_at: new Date().toISOString(),
          body: 'Postingan baru',
          reaction_count: 0,
          comment_count: 0,
        },
      },
    });

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Belum ada postingan/)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Ceritakan aksi kecilmu/);
    fireEvent.change(textarea, { target: { value: 'Postingan baru' } });

    const submitBtn = screen.getByText('Kirim');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.posts.create).toHaveBeenCalledWith({
        body: 'Postingan baru',
        post_type: 'daily_win',
        habit_id: null,
      });
      expect(screen.getByText('Postingan baru')).toBeInTheDocument();
    });
  });

  it('handles post deletion with confirm', async () => {
    const originalConfirm = window.confirm;
    window.confirm = vi.fn().mockReturnValue(true);

    api.habits.list.mockResolvedValueOnce({ data: { habits: [] } });
    api.posts.list.mockResolvedValueOnce({
      data: {
        posts: [
          {
            id: 103,
            author: { id: 1, username: 'tester', display_name: 'Tester User' },
            post_type: 'reflection',
            created_at: new Date().toISOString(),
            body: 'Post to delete',
            reaction_count: 0,
            comment_count: 0,
          },
        ],
      },
      meta: { next_cursor: null, has_more: false },
    });
    api.posts.delete.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Post to delete')).toBeInTheDocument();

    const deleteBtn = screen.getByTitle('Hapus postingan');
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(api.posts.delete).toHaveBeenCalledWith(103);
    });

    window.confirm = originalConfirm;
  });

  it('handles reaction toggle on post', async () => {
    api.habits.list.mockResolvedValueOnce({ data: { habits: [] } });
    api.posts.list.mockResolvedValueOnce({
      data: {
        posts: [
          {
            id: 104,
            author: { id: 2, username: 'other', display_name: 'Other User' },
            post_type: 'daily_win',
            created_at: new Date().toISOString(),
            body: 'Another win',
            reaction_count: 0,
            comment_count: 0,
            my_reaction: null,
          },
        ],
      },
      meta: { next_cursor: null, has_more: false },
    });
    api.posts.reaction.set.mockResolvedValueOnce({});

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Another win')).toBeInTheDocument();

    const cheerBtn = screen.getByText('Cheer');
    fireEvent.click(cheerBtn);

    await waitFor(() => {
      expect(api.posts.reaction.set).toHaveBeenCalledWith(104, 'cheer');
    });
  });

  it('handles expanding comments and submitting a comment', async () => {
    api.habits.list.mockResolvedValueOnce({ data: { habits: [] } });
    api.posts.list.mockResolvedValueOnce({
      data: {
        posts: [
          {
            id: 105,
            author: { id: 2, username: 'other', display_name: 'Other User' },
            post_type: 'daily_win',
            created_at: new Date().toISOString(),
            body: 'Win with comments',
            reaction_count: 0,
            comment_count: 1,
            my_reaction: null,
          },
        ],
      },
      meta: { next_cursor: null, has_more: false },
    });

    api.posts.comments.list.mockResolvedValueOnce({
      data: {
        comments: [
          {
            id: 501,
            user_id: 3,
            user: { display_name: 'Commenter' },
            body: 'Hebat sekali!',
            created_at: new Date().toISOString(),
          },
        ],
      },
    });

    api.posts.comments.create.mockResolvedValueOnce({
      data: {
        comment: {
          id: 502,
          user_id: 1,
          user: { display_name: 'Tester User' },
          body: 'Terima kasih!',
          created_at: new Date().toISOString(),
        },
      },
    });

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Win with comments')).toBeInTheDocument();

    const commentsToggle = screen.getByText('1');
    fireEvent.click(commentsToggle);

    expect(await screen.findByText('Hebat sekali!')).toBeInTheDocument();

    const commentInput = screen.getByPlaceholderText(/Tulis pesan penyemangat/);
    fireEvent.change(commentInput, { target: { value: 'Terima kasih!' } });

    const submitButtons = screen.getAllByRole('button', { name: 'Kirim' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    await waitFor(() => {
      expect(api.posts.comments.create).toHaveBeenCalledWith(105, { body: 'Terima kasih!' });
    });
  });

  it('filters posts by type tabs', async () => {
    api.habits.list.mockResolvedValue({ data: { habits: [] } });
    api.posts.list.mockResolvedValue({
      data: { posts: [] },
      meta: { next_cursor: null, has_more: false },
    });

    render(
      <MemoryRouter>
        <CommunityPage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Belum ada postingan/)).toBeInTheDocument();

    const winTab = screen.getByText('🎉 Daily Wins');
    fireEvent.click(winTab);

    await waitFor(() => {
      expect(api.posts.list).toHaveBeenCalledWith(expect.objectContaining({ post_type: 'daily_win' }));
    });

    const reflectionTabs = screen.getAllByText('💭 Refleksi');
    fireEvent.click(reflectionTabs[reflectionTabs.length - 1]);

    await waitFor(() => {
      expect(api.posts.list).toHaveBeenCalledWith(expect.objectContaining({ post_type: 'reflection' }));
    });
  });
});
