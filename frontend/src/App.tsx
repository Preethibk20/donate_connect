import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { NgoListPage } from './pages/NgoListPage';
import { NgoDetailPage } from './pages/NgoDetailPage';
import { ImpactPage } from './pages/ImpactPage';
import { MapViewPage } from './pages/MapViewPage';
import { SmartLockersPage } from './pages/SmartLockersPage';
import { BlockchainLedgerPage } from './pages/BlockchainLedgerPage';
import { CircularMarketplacePage } from './pages/CircularMarketplacePage';
import { DriverDashboardPage } from './pages/DriverDashboardPage';
import { CorporateDashboardPage } from './pages/CorporateDashboardPage';
import { CreateDonationPage } from './pages/CreateDonationPage';
import { MyDonationsPage } from './pages/MyDonationsPage';
import { NgoDashboardPage } from './pages/NgoDashboardPage';
import { NgoInventoryPage } from './pages/NgoInventoryPage';
import { NgoProfilePage } from './pages/NgoProfilePage';
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import { AdminNgosPage } from './pages/AdminNgosPage';
import { AdminDonationsPage } from './pages/AdminDonationsPage';
import { AdminProfilePage } from './pages/AdminProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DonorProfilePage } from './pages/DonorProfilePage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { EmergencySosBanner } from './components/EmergencySosBanner';

const AppShell: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#111827] selection:bg-[#7567E8] selection:text-white">
          <EmergencySosBanner />
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/ngos" element={<NgoListPage />} />
              <Route path="/ngos/:id" element={<NgoDetailPage />} />
              <Route path="/impact" element={<ImpactPage />} />
              <Route path="/map" element={<MapViewPage />} />
              <Route path="/lockers" element={<SmartLockersPage />} />
              <Route path="/blockchain-ledger" element={<BlockchainLedgerPage />} />
              <Route path="/circular-market" element={<CircularMarketplacePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected Donor Routes */}
              <Route element={<ProtectedRoute allowedRoles={['DONOR', 'ADMIN']} />}>
                <Route path="/donor/profile" element={<DonorProfilePage />} />
                <Route path="/donate/new" element={<CreateDonationPage />} />
                <Route path="/donations/new" element={<Navigate to="/donate/new" replace />} />
                <Route path="/donations" element={<MyDonationsPage />} />
                <Route path="/my-donations" element={<Navigate to="/donations" replace />} />
              </Route>

              {/* Protected NGO Routes */}
              <Route element={<ProtectedRoute allowedRoles={['NGO', 'ADMIN']} />}>
                <Route path="/ngo-dashboard" element={<NgoDashboardPage />} />
                <Route path="/ngo-dashboard/inventory" element={<NgoInventoryPage />} />
                <Route path="/ngo-dashboard/profile" element={<NgoProfilePage />} />
              </Route>

              {/* Protected Volunteer Driver Routes */}
              <Route element={<ProtectedRoute allowedRoles={['VOLUNTEER', 'ADMIN']} />}>
                <Route path="/driver-dashboard" element={<DriverDashboardPage />} />
              </Route>

              {/* Protected Corporate CSR Routes */}
              <Route element={<ProtectedRoute allowedRoles={['CORPORATE', 'ADMIN']} />}>
                <Route path="/csr-dashboard" element={<CorporateDashboardPage />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminOverviewPage />} />
                <Route path="/admin/profile" element={<AdminProfilePage />} />
                <Route path="/admin/ngos" element={<AdminNgosPage />} />
                <Route path="/admin/donations" element={<AdminDonationsPage />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export const App: React.FC = () => <AppShell />;

export default App;
