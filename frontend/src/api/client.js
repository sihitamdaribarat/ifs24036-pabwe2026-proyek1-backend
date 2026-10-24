const BASE_URL = '/api/v1';

let accessToken = localStorage.getItem('access_token') || null;

export function setToken(token) {
  accessToken = token;
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
}

export function getToken() {
  return accessToken;
}

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const config = {
    ...options,
    headers,
  };

  let response = await fetch(`${BASE_URL}${path}`, config);

  // If 401 TOKEN_EXPIRED, try to refresh token automatically
  if (response.status === 401 && accessToken && !path.startsWith('/auth/')) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.data?.access_token) {
          setToken(refreshData.data.access_token);
          headers['Authorization'] = `Bearer ${refreshData.data.access_token}`;
          response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
        }
      } else {
        setToken(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    } catch (err) {
      setToken(null);
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return { success: true };
  }

  let data;
  try {
    data = await response.json();
  } catch {
    const error = new Error(
      response.status >= 500
        ? 'Server sedang tidak dapat dihubungi. Silakan coba beberapa saat lagi.'
        : `Terjadi kesalahan respons server (${response.status})`
    );
    error.code = 'RESPONSE_PARSE_ERROR';
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(data.error?.message || 'Terjadi kesalahan');
    error.code = data.error?.code || 'UNKNOWN_ERROR';
    error.status = response.status;
    error.details = data.error?.details || null;
    throw error;
  }

  return data;
}

// API methods
export const api = {
  auth: {
    register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    getMe: () => request('/users/me'),
    updateMe: (body) => request('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  },
  habits: {
    list: (status = 'active') => request(`/habits?status=${status}`),
    create: (body) => request('/habits', { method: 'POST', body: JSON.stringify(body) }),
    get: (id) => request(`/habits/${id}`),
    update: (id, body) => request(`/habits/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    archive: (id) => request(`/habits/${id}`, { method: 'DELETE' }),
    restore: (id) => request(`/habits/${id}/restore`, { method: 'POST' }),
    today: () => request('/dashboard/today'),
  },
  logs: {
    create: (habitId, body = {}) => request(`/habits/${habitId}/logs`, { method: 'POST', body: JSON.stringify(body) }),
    delete: (habitId, logDate) => request(`/habits/${habitId}/logs/${logDate}`, { method: 'DELETE' }),
    list: (habitId, params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/habits/${habitId}/logs${q ? '?' + q : ''}`);
    },
    streak: (habitId) => request(`/habits/${habitId}/streak`),
  },
  posts: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/posts${q ? '?' + q : ''}`);
    },
    create: (body) => request('/posts', { method: 'POST', body: JSON.stringify(body) }),
    get: (id) => request(`/posts/${id}`),
    update: (id, body) => request(`/posts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
    comments: {
      list: (postId, params = {}) => {
        const q = new URLSearchParams(params).toString();
        return request(`/posts/${postId}/comments${q ? '?' + q : ''}`);
      },
      create: (postId, body) => request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify(body) }),
      delete: (commentId) => request(`/comments/${commentId}`, { method: 'DELETE' }),
    },
    reaction: {
      set: (postId, type) => request(`/posts/${postId}/reaction`, { method: 'PUT', body: JSON.stringify({ type }) }),
      remove: (postId) => request(`/posts/${postId}/reaction`, { method: 'DELETE' }),
    },
  },
  users: {
    getProfile: (username) => request(`/u/${username}`),
  },
};
