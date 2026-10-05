import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import * as AuthContextModule from '../context/AuthContext';
import { Role } from '../types';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(AuthContextModule.useAuth);

describe('ProtectedRoute', () => {
  const renderRoute = (allowedRoles?: Role[]) => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/protected" element={<div data-testid="protected-content">Protected Content</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
          <Route path="/unauthorized" element={<div data-testid="unauthorized-page">Unauthorized Page</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('shows loading spinner when loading is true', () => {
    mockUseAuth.mockReturnValue({
      loading: true,
      isAuthenticated: false,
      user: null,
    } as any);

    renderRoute();
    
    // Check if loading element is present. In the component it's an animate-spin div.
    // The spinner has no role or testid, but we can query by a characteristic class.
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: false,
      user: null,
    } as any);

    renderRoute();

    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('redirects to /unauthorized when authenticated but role is not allowed', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: { role: 'DONOR' },
    } as any);

    renderRoute(['NGO', 'ADMIN']);

    expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('renders outlet when authenticated and role is allowed', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: { role: 'ADMIN' },
    } as any);

    renderRoute(['NGO', 'ADMIN']);

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('unauthorized-page')).not.toBeInTheDocument();
  });

  it('renders outlet when authenticated and no allowedRoles specified', () => {
    mockUseAuth.mockReturnValue({
      loading: false,
      isAuthenticated: true,
      user: { role: 'DONOR' },
    } as any);

    renderRoute();

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });
});
