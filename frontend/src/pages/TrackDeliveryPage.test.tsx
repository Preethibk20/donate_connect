import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TrackDeliveryPage } from './TrackDeliveryPage';
import * as donationApi from '../api/donationApi';
import * as AuthContextModule from '../context/AuthContext';
import { Client } from '@stomp/stompjs';

vi.mock('../api/donationApi', () => ({
  getDonationById: vi.fn(),
  getDeliveryByDonationId: vi.fn(),
  getLiveLocation: vi.fn(),
  completeDelivery: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock STOMP Client
const mockStompClient = {
  activate: vi.fn(),
  deactivate: vi.fn(),
  subscribe: vi.fn(),
  connected: false,
};

vi.mock('@stomp/stompjs', () => {
  return {
    Client: class {
      activate = mockStompClient.activate;
      deactivate = mockStompClient.deactivate;
      subscribe = mockStompClient.subscribe;
      get connected() { return mockStompClient.connected; }
      constructor(config: any) {
        if (config?.onConnect) {
          setTimeout(config.onConnect, 10);
        }
      }
    },
  };
});

// Mock Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: any) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  Polyline: () => <div data-testid="polyline" />,
}));

describe('TrackDeliveryPage', () => {
  const mockDonation = {
    id: 'test-id',
    category: 'CLOTHES',
    status: 'PICKED_UP',
    pickupLat: 28.1,
    pickupLng: 77.1,
    ngo: { name: 'Test NGO', latitude: 28.2, longitude: 77.2, address: 'Test Address' },
  };

  const mockDelivery = {
    id: 'delivery-1',
    status: 'PICKED_UP',
  };

  let mockLoc: any;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 9, 5, 12, 0, 0)); // Set a fixed system time
    mockLoc = { lat: 28.15, lng: 77.15, timestamp: new Date().toISOString() };
    vi.clearAllMocks();
    
    vi.mocked(donationApi.getDonationById).mockResolvedValue(mockDonation as any);
    vi.mocked(donationApi.getDeliveryByDonationId).mockResolvedValue(mockDelivery as any);
    vi.mocked(donationApi.getLiveLocation).mockResolvedValue(mockLoc);
    
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      token: 'test-token',
      user: { role: 'VOLUNTEER' },
    } as any);
    
    // reset mock stomp client
    mockStompClient.connected = false;
    mockStompClient.activate.mockClear();
    mockStompClient.deactivate.mockClear();
    mockStompClient.subscribe.mockClear();
    
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ code: 'Ok', routes: [] }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderPage = () => {
    return render(
      <MemoryRouter initialEntries={['/track/test-id']}>
        <Routes>
          <Route path="/track/:id" element={<TrackDeliveryPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders and fetches initial data', async () => {
    renderPage();
    
    // Check loading state
    expect(screen.getByText('Initializing live map tracker...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Initializing live map tracker...')).not.toBeInTheDocument();
    });
    
    expect(donationApi.getDonationById).toHaveBeenCalledWith('test-id');
    expect(donationApi.getLiveLocation).toHaveBeenCalledWith('test-id');
    expect(screen.getByText(/Live Delivery Tracking/i)).toBeInTheDocument();
    expect(screen.getByText(/CLOTHES/i)).toBeInTheDocument();
  });

  it('handles offline state and polling fallback when websocket drops', async () => {
    renderPage();
    
    await waitFor(() => expect(screen.queryByText('Initializing live map tracker...')).not.toBeInTheDocument());
    
    // Ensure we are initially online
    expect(screen.getByText(/Live GPS/i)).toBeInTheDocument();
    
    // Simulate time passing > 30s without update to trigger offline state
    act(() => {
      vi.advanceTimersByTime(35000);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Offline/i)).toBeInTheDocument();
    });
    
    // Check polling fallback. Every 10s it polls if disconnected. 
    // Advance timers to trigger polling.
    vi.mocked(donationApi.getLiveLocation).mockClear();
    
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    
    // Should have called getLiveLocation since connected = false
    expect(donationApi.getLiveLocation).toHaveBeenCalledWith('test-id');
  });

  it('shows Mark Delivered modal (Verification Form) for volunteer on PICKED_UP delivery and handles submit', async () => {
    renderPage();
    
    await waitFor(() => expect(screen.queryByText('Initializing live map tracker...')).not.toBeInTheDocument());
    
    expect(screen.getByText('Verification Form')).toBeInTheDocument();
    
    // Submit with empty OTP and image
    const completeBtn = screen.getByRole('button', { name: /Complete Delivery/i });
    expect(completeBtn).toBeDisabled();
    
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    
    // Fill OTP
    const otpInputs = screen.getAllByRole('textbox');
    for (let i = 0; i < 6; i++) {
      await user.type(otpInputs[i], '1');
    }
    
    // Upload image
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    // Find the file input - it's hidden, so we need to get it by its type or label
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);
    
    expect(completeBtn).not.toBeDisabled();
    
    // Mock successful complete
    vi.mocked(donationApi.completeDelivery).mockResolvedValueOnce({});
    
    await user.click(completeBtn);
    
    expect(donationApi.completeDelivery).toHaveBeenCalledWith('delivery-1', '111111', file);
  });
});
