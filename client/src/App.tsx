import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import { UpdateProvider } from './context/UpdateContext';
import { AuthModal } from './components/auth/AuthModal';
import { Header } from './components/common/Header';
import { Navbar, NavTab } from './components/common/Navbar';
import { UpdateBanner } from './components/updates/UpdateBanner';
import { Dashboard } from './pages/Dashboard';
import { FillupsPage } from './pages/FillupsPage';
import { ServicesPage } from './pages/ServicesPage';
import { UpgradesPage } from './pages/UpgradesPage';
import { RemindersPage } from './pages/RemindersPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

export const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="ApexDrive" className="w-5 h-5" />
            <span className="text-xs text-slate-300 font-semibold tracking-wide">Loading ApexDrive...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'fillups':
        return <FillupsPage />;
      case 'services':
        return <ServicesPage />;
      case 'upgrades':
        return <UpgradesPage />;
      case 'reminders':
        return <RemindersPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <VehicleProvider>
      <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
        <UpdateBanner />
        <Header />
        <Navbar activeTab={activeTab} onSelectTab={setActiveTab} />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-6 pb-24 md:pb-8">
          {renderContent()}
        </main>
      </div>
    </VehicleProvider>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <UpdateProvider>
        <AppContent />
      </UpdateProvider>
    </AuthProvider>
  );
};


export default App;
