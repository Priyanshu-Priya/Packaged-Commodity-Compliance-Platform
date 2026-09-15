import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './pages/DashboardView';
import { NewScanView } from './pages/NewScanView';
import { RulesView } from './pages/RulesView';
import { HistoryView } from './pages/HistoryView';
import { ScanDetailView } from './pages/ScanDetailView';
import { api } from './services/api';
import { Scale } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [systemReady, setSystemReady] = useState<boolean>(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);

  useEffect(() => {
    async function checkSystem() {
      try {
        const ready = await api.getReadiness();
        setSystemReady(ready.status === 'ready');
      } catch (err) {
        setSystemReady(false);
      }
    }
    checkSystem();
    const interval = setInterval(checkSystem, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleScanCreated = (scanId: string) => {
    setSelectedScanId(scanId);
  };

  const handleViewScan = (scanId: string) => {
    setSelectedScanId(scanId);
  };

  const handleBackToLedger = () => {
    setSelectedScanId(null);
  };

  const handleTabChange = (tab: string) => {
    setSelectedScanId(null);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gov-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        systemReady={systemReady}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedScanId ? (
          <ScanDetailView
            scanId={selectedScanId}
            onBack={handleBackToLedger}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                onStartNewScan={() => handleTabChange('scan')}
                onViewScan={handleViewScan}
              />
            )}
            {activeTab === 'scan' && (
              <NewScanView onScanCreated={handleScanCreated} />
            )}
            {activeTab === 'history' && (
              <HistoryView onViewScan={handleViewScan} />
            )}
            {activeTab === 'rules' && (
              <RulesView />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-gov-900 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-gold-500/80" />
            <span className="text-slate-400 font-medium">
              Legal Metrology (Packaged Commodities) Rules, 2011 Compliance Platform
            </span>
          </div>
          <p className="text-slate-500 text-[11px]">
            AI extracts &amp; measures • Deterministic rules decide compliance • Government of India
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
