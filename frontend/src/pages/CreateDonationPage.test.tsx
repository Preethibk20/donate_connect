import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDonationPage } from './CreateDonationPage';
import * as ngoApi from '../api/ngoApi';
import * as donationApi from '../api/donationApi';
import { ToastProvider } from '../context/ToastContext';

vi.mock('../api/ngoApi', () => ({
  getVerifiedNgos: vi.fn(),
}));

vi.mock('../api/donationApi', () => ({
  createDonation: vi.fn(),
  uploadDonationPhoto: vi.fn(),
}));

// Mock map components to avoid Leaflet errors in jsdom
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  useMapEvents: () => null,
}));

describe('CreateDonationPage Form Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ngoApi.getVerifiedNgos).mockResolvedValue([
      {
        id: 'ngo1',
        name: 'Test NGO',
        email: 'ngo@test.com',
        phone: '1234567890',
        address: '123 Main St',
        verified: true,
        role: 'NGO',
        createdAt: '2023-01-01',
      },
    ]);
  });

  const renderPage = () => {
    return render(
      <MemoryRouter>
        <ToastProvider>
          <CreateDonationPage />
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('shows required field errors on empty submit', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Donation Request/i })).not.toBeDisabled();
    });

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Submit Donation Request/i }));

    await waitFor(() => {
      expect(screen.getByText('Please select an NGO')).toBeInTheDocument();
      expect(screen.getByText('Pickup address is required')).toBeInTheDocument();
      expect(screen.getByText('Item description is required')).toBeInTheDocument();
      expect(screen.getByText('Preferred pickup date is required')).toBeInTheDocument();
      expect(screen.getByText('Time slot is required')).toBeInTheDocument();
    });
  });

  it('validates description length (too short)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /Submit Donation Request/i })).not.toBeDisabled());

    const user = userEvent.setup();
    const descriptionInput = screen.getByPlaceholderText(/Describe the items being donated/i);
    await user.type(descriptionInput, 'Too short');
    
    await user.click(screen.getByRole('button', { name: /Submit Donation Request/i }));

    await waitFor(() => {
      expect(screen.getByText('Description must be at least 20 characters')).toBeInTheDocument();
    });
  });

  it('shows error if no photos are uploaded and map is not pinned (even if fields are valid)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /Submit Donation Request/i })).not.toBeDisabled());

    const user = userEvent.setup();
    
    await user.selectOptions(screen.getByRole('combobox', { name: /Select NGO Partner \*/i }), 'ngo1');
    
    // Valid date (future)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: dateStr } });
    }
    
    await user.selectOptions(screen.getByRole('combobox', { name: /Preferred Time Slot/i }), 'MORNING_9_12');
    
    await user.type(screen.getByPlaceholderText(/Enter complete pickup address/i), '123 Main St, Apt 4B');
    await user.type(screen.getByPlaceholderText(/Describe the items being donated/i), 'These are some items in very good condition with lots of details.');

    await user.click(screen.getByRole('button', { name: /Submit Donation Request/i }));

    await waitFor(() => {
      // Because we didn't mock file uploads in UI flow to actually have photos
      expect(screen.getByText('Please upload at least one clear photo of the items.')).toBeInTheDocument();
    });
  });

  it('shows error for past pickup date', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /Submit Donation Request/i })).not.toBeDisabled());

    const user = userEvent.setup();
    
    // Past date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: dateStr } });
    }
    
    await user.click(screen.getByRole('button', { name: /Submit Donation Request/i }));

    await waitFor(() => {
      expect(screen.getByText('Pickup date cannot be in the past')).toBeInTheDocument();
    });
  });
});
