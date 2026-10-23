import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const store = {};
const localStorageMock = {
  getItem: vi.fn((key) => store[key] || null),
  setItem: vi.fn((key, value) => { store[key] = value; }),
  removeItem: vi.fn((key) => { delete store[key]; }),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

import { setToken, getToken, request, api } from '../api/client.js';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setToken(null);
  });

  describe('setToken', () => {
    it('stores token in localStorage when token is provided', () => {
      setToken('test-token-123');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', 'test-token-123');
    });

    it('removes token from localStorage when null', () => {
      setToken(null);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    });
  });

  describe('getToken', () => {
    it('returns current token', () => {
      setToken('my-token');
      expect(getToken()).toBe('my-token');
    });

    it('returns null when no token set', () => {
      setToken(null);
      expect(getToken()).toBeNull();
    });
  });

  describe('request', () => {
    it('makes a GET request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: { items: [] } }),
      });

      const result = await request('/habits');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/habits',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual({ success: true, data: { items: [] } });
    });

    it('includes Authorization header when token is set', async () => {
      setToken('bearer-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await request('/users/me');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer bearer-token',
          }),
        })
      );
    });

    it('handles 204 No Content response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await request('/auth/logout', { method: 'POST' });
      expect(result).toEqual({ success: true });
    });

    it('throws error for non-ok responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: { message: 'Bad Request', code: 'VALIDATION_ERROR' },
        }),
      });

      await expect(request('/habits', { method: 'POST' })).rejects.toThrow('Bad Request');
    });

    it('throws default error message when no error message in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: {} }),
      });

      await expect(request('/habits')).rejects.toThrow('Terjadi kesalahan');
    });
  });

  describe('api methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      });
    });

    it('api.auth.login sends POST request', async () => {
      await api.auth.login({ email: 'test@test.com', password: 'pass' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/login',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('api.auth.register sends POST request', async () => {
      await api.auth.register({ username: 'user', email: 'e@e.com', password: 'p' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/register',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('api.auth.logout sends POST request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
      await api.auth.logout();
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/auth/logout',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('api.auth.getMe sends GET request', async () => {
      await api.auth.getMe();
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/users/me', expect.any(Object));
    });

    it('api.auth.updateMe sends PATCH request', async () => {
      await api.auth.updateMe({ display_name: 'New Name' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/users/me',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('api.habits.list sends GET with status param', async () => {
      await api.habits.list('active');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/habits?status=active',
        expect.any(Object)
      );
    });

    it('api.habits.create sends POST request', async () => {
      await api.habits.create({ title: 'Read', emoji: '📖' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/habits',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('api.habits.get sends GET request', async () => {
      await api.habits.get(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/habits/1', expect.any(Object));
    });

    it('api.habits.update sends PATCH request', async () => {
      await api.habits.update(1, { title: 'Updated' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/habits/1',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('api.habits.archive sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
      await api.habits.archive(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/habits/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('api.habits.restore sends POST request', async () => {
      await api.habits.restore(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/habits/1/restore',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('api.habits.today sends GET request', async () => {
      await api.habits.today();
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/dashboard/today', expect.any(Object));
    });

    it('api.logs.create sends POST request', async () => {
      await api.logs.create(1, {});
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/habits/1/logs',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('api.logs.delete sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
      await api.logs.delete(1, '2026-01-01');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/habits/1/logs/2026-01-01',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('api.logs.list sends GET with params', async () => {
      await api.logs.list(1, { limit: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/habits/1/logs?'),
        expect.any(Object)
      );
    });

    it('api.logs.streak sends GET request', async () => {
      await api.logs.streak(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/habits/1/streak', expect.any(Object));
    });

    it('api.posts.list sends GET request', async () => {
      await api.posts.list({ page: 1 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/posts?'),
        expect.any(Object)
      );
    });

    it('api.posts.create sends POST request', async () => {
      await api.posts.create({ body: 'Hello!' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/posts',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('api.posts.get sends GET request', async () => {
      await api.posts.get(1);
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/posts/1', expect.any(Object));
    });

    it('api.posts.update sends PATCH request', async () => {
      await api.posts.update(1, { body: 'Updated' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/posts/1',
        expect.objectContaining({ method: 'PATCH' })
      );
    });

    it('api.posts.delete sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
      await api.posts.delete(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/posts/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('api.posts.comments.list sends GET request', async () => {
      await api.posts.comments.list(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/posts/1/comments',
        expect.any(Object)
      );
    });

    it('api.posts.comments.create sends POST request', async () => {
      await api.posts.comments.create(1, { body: 'Nice!' });
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/posts/1/comments',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('api.posts.comments.delete sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
      await api.posts.comments.delete(5);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/comments/5',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('api.posts.reaction.set sends PUT request', async () => {
      await api.posts.reaction.set(1, 'cheer');
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/posts/1/reaction',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('api.posts.reaction.remove sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });
      await api.posts.reaction.remove(1);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/posts/1/reaction',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('api.users.getProfile sends GET request', async () => {
      await api.users.getProfile('johndoe');
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/u/johndoe', expect.any(Object));
    });
  });
});
