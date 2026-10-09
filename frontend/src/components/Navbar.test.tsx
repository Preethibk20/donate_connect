import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';
import { AuthProvider } from '../context/AuthContext';

// Mock matchMedia for Navbar
window.matchMedia = window.matchMedia || function() {
    return {
        matches: false,
        addListener: function() {},
        removeListener: function() {}
    };
};

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  const renderNavbar = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('hides prototype links when VITE_SHOW_PROTOTYPES is not true', () => {
    import.meta.env.VITE_SHOW_PROTOTYPES = 'false';
    renderNavbar();
    expect(screen.queryByText(/Lockers/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Blockchain/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Circular/i)).not.toBeInTheDocument();
  });

  it('shows prototype links when VITE_SHOW_PROTOTYPES is true', () => {
    import.meta.env.VITE_SHOW_PROTOTYPES = 'true';
    renderNavbar();
    expect(screen.getByText(/Lockers/i)).toBeInTheDocument();
    expect(screen.getByText(/Blockchain/i)).toBeInTheDocument();
    expect(screen.getByText(/Circular/i)).toBeInTheDocument();
  });
});
