import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DatabaseStatusBanner } from './components/DatabaseStatusBanner';
import { HomePage } from './pages/HomePage';
import { ReportComplaintPage } from './pages/ReportComplaintPage';
import { TrackComplaintPage } from './pages/TrackComplaintPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ComplaintDetailPage } from './pages/ComplaintDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | number | undefined>(undefined);

  // Sync with browser URL hash
  const parseHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    if (!hash) {
      setCurrentView('home');
      setViewParam(undefined);
      return;
    }

    const parts = hash.split('/');
    const view = parts[0];
    const param = parts[1];

    if (
      [
        'home',
        'report',
        'track',
        'citizen-dashboard',
        'admin-dashboard',
        'complaint-detail',
        'login',
        'register',
      ].includes(view)
    ) {
      setCurrentView(view);
      setViewParam(param);
    } else {
      setCurrentView('not-found');
      setViewParam(undefined);
    }
  };

  useEffect(() => {
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  const navigate = (view: string, param?: string | number) => {
    setCurrentView(view);
    setViewParam(param);
    if (param !== undefined) {
      window.location.hash = `#${view}/${param}`;
    } else {
      window.location.hash = `#${view}`;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage navigate={navigate} />;
      case 'report':
        return (
          <ReportComplaintPage
            navigate={navigate}
            initialCategory={typeof viewParam === 'string' ? viewParam : undefined}
          />
        );
      case 'track':
        return (
          <TrackComplaintPage
            navigate={navigate}
            initialCode={typeof viewParam === 'string' ? viewParam : undefined}
          />
        );
      case 'citizen-dashboard':
        return <CitizenDashboardPage navigate={navigate} />;
      case 'admin-dashboard':
        return <AdminDashboardPage navigate={navigate} />;
      case 'complaint-detail':
        return (
          <ComplaintDetailPage
            complaintIdOrCode={viewParam || 1}
            navigate={navigate}
          />
        );
      case 'login':
        return <LoginPage navigate={navigate} />;
      case 'register':
        return <RegisterPage navigate={navigate} />;
      default:
        return <NotFoundPage navigate={navigate} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
        {/* Real Database Health and Engine Banner */}
        <DatabaseStatusBanner />

        {/* Global Navigation Bar */}
        <Navbar currentView={currentView} navigate={navigate} />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          {renderCurrentView()}
        </main>

        {/* Global Civic Footer */}
        <Footer navigate={navigate} />
      </div>
    </AuthProvider>
  );
}
