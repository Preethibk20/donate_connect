import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import * as authApi from '../api/authApi';
import * as client from '../api/client';
import { Role } from '../types';

vi.mock('../api/authApi', () => ({
  loginApi: vi.fn(),
  registerDonorApi: vi.fn(),
  getCurrentUserApi: vi.fn(),
  verifyOtpApi: vi.fn(),
}));

vi.mock('../api/client', () => ({
  setAuthTokenInMemory: vi.fn(),
  registerLogoutCallback: vi.fn((cb) => {
    // we could save the callback to call it manually
    (global as any).__logoutCallback = cb;
  }),
}));

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  role: 'DONOR' as Role,
  phone: '1234567890',
  createdAt: '2023-01-01',
};

const TestComponent = () => {
  const { user, token, isAuthenticated, loading, login, logout, refetchUser } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'true' : 'false'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <div data-testid="token">{token || 'null'}</div>
      <div data-testid="user-name">{user ? user.name : 'null'}</div>
      <button
        data-testid="login-btn"
        onClick={() => login({ email: 'test@example.com', password: 'password' })}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
      <button data-testid="refetch-btn" onClick={refetchUser}>
        Refetch
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (global as any).__logoutCallback;
  });

  it('initializes with loading true then resolves to unauthenticated when no token', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state check - usually skips straight to false if no token in sync execution
    // but useEffect for getCurrentUserApi is async only if token exists. 
    // Wait for the effect to finish
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(screen.getByTestId('user-name')).toHaveTextContent('null');
  });

  it('fetches user on load if token exists in localStorage', async () => {
    localStorage.setItem('dc-token', 'mock-token');
    vi.mocked(authApi.getCurrentUserApi).mockResolvedValueOnce(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('token')).toHaveTextContent('mock-token');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    expect(client.setAuthTokenInMemory).toHaveBeenCalledWith('mock-token');
  });

  it('logs out and clears state if getCurrentUserApi fails (expired token)', async () => {
    localStorage.setItem('dc-token', 'expired-token');
    localStorage.setItem('dc-user', JSON.stringify(mockUser));
    vi.mocked(authApi.getCurrentUserApi).mockRejectedValueOnce(new Error('Expired'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(screen.getByTestId('user-name')).toHaveTextContent('null');
    expect(localStorage.getItem('dc-token')).toBeNull();
  });

  it('performs login successfully', async () => {
    vi.mocked(authApi.loginApi).mockResolvedValueOnce({
      token: 'new-token',
      user: mockUser,
      requiresOtp: false,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));

    const userActions = userEvent.setup();
    await userActions.click(screen.getByTestId('login-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('token')).toHaveTextContent('new-token');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    expect(localStorage.getItem('dc-token')).toBe('new-token');
    expect(client.setAuthTokenInMemory).toHaveBeenCalledWith('new-token');
  });

  it('performs logout successfully', async () => {
    localStorage.setItem('dc-token', 'mock-token');
    vi.mocked(authApi.getCurrentUserApi).mockResolvedValueOnce(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('authenticated')).toHaveTextContent('true'));

    const userActions = userEvent.setup();
    await userActions.click(screen.getByTestId('logout-btn'));

    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
    expect(screen.getByTestId('token')).toHaveTextContent('null');
    expect(localStorage.getItem('dc-token')).toBeNull();
    expect(client.setAuthTokenInMemory).toHaveBeenCalledWith(null);
  });
});
