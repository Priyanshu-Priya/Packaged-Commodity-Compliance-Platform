import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './pages/DashboardView';
import { NewScanView } from './pages/NewScanView';
import { RulesView } from './pages/RulesView';
import { HistoryView } from './pages/HistoryView';
import { ScanDetailView } from './pages/ScanDetailView';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [systemReady, setSystemReady] = useState<boolean>(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

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
    setMobileNavOpen(false);
  };

  const handleViewScan = (scanId: string) => {
    setSelectedScanId(scanId);
    setMobileNavOpen(false);
  };

  const handleBackToLedger = () => {
    setSelectedScanId(null);
  };

  const handleTabChange = (tab: string) => {
    setSelectedScanId(null);
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  // Determine page title for header
  const getPageMeta = () => {
    if (selectedScanId) {
      return {
        title: 'Inspection Detail',
        subtitle: 'Detailed compliance verification and evidence review',
      };
    }
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Compliance Overview', subtitle: 'Monitor product inspections and label verification results.' };
      case 'scan':
        return { title: 'New Inspection', subtitle: 'Upload and verify a packaged commodity label.' };
      case 'history':
        return { title: 'Inspection History', subtitle: 'Complete audit log of past inspections.' };
      case 'rules':
        return { title: 'Legal Rules Registry', subtitle: 'Statutory requirements under PCR 2011.' };
      default:
        return { title: 'LabelCheck AI', subtitle: 'Inspect smarter. Verify faster.' };
    }
  };

  const pageMeta = getPageMeta();

  return (
    <div className="min-h-screen bg-canvas text-ink font-sans flex">
      {/* Sidebar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        systemReady={systemReady}
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
      />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-0">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 h-[64px] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg border border-border bg-surface text-ink-secondary hover:text-ink hover:border-border-strong"
                aria-label="Open navigation"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="min-w-0">
                <h1 className="text-[15px] font-semibold tracking-tight text-ink leading-none truncate">
                  {pageMeta.title}
                </h1>
                <p className="text-[12px] text-ink-secondary mt-1 leading-none truncate hidden sm:block">
                  {pageMeta.subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* System status */}
              <div className="hidden sm:flex items-center gap-2 pl-3 pr-3 py-1.5 rounded-full bg-surface-subtle border border-border text-[11px]">
                <span className={`w-2 h-2 rounded-full ${systemReady ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                <span className="text-ink-secondary font-medium">
                  {systemReady ? 'Engine Active' : 'Connecting'}
                </span>
                <span className="w-px h-3 bg-border mx-1" />
                <span className="font-mono text-[10px] text-ink-tertiary">PCR 2011 • v2023</span>
              </div>

              {/* User */}
              <div className="flex items-center gap-2">
                <div className="hidden sm:block text-right leading-none">
                  <div className="text-[12px] font-medium text-ink">Enforcement Officer</div>
                  <div className="text-[10px] text-ink-tertiary">Legal Metrology Dept</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center text-[11px] font-semibold">
                  EO
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1440px] w-full mx-auto">
          {selectedScanId ? (
            <ScanDetailView scanId={selectedScanId} onBack={handleBackToLedger} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView onStartNewScan={() => handleTabChange('scan')} onViewScan={handleViewScan} />
              )}
              {activeTab === 'scan' && <NewScanView onScanCreated={handleScanCreated} />}
              {activeTab === 'history' && <HistoryView onViewScan={handleViewScan} />}
              {activeTab === 'rules' && <RulesView />}
            </>
          )}
        </main>

        {/* Footer - minimal enterprise */}
        <footer className="border-t border-border-subtle bg-surface-subtle/50">
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-ink-tertiary">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink-secondary">LabelCheck AI</span>
              <span className="w-px h-3 bg-border" />
              <span>Inspect smarter. Verify faster.</span>
            </div>
            <div className="flex items-center gap-3">
              <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
              <span className="hidden sm:inline w-px h-3 bg-border" />
              <span className="hidden sm:inline">AI extracts • Rules decide • Evidence-backed</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
