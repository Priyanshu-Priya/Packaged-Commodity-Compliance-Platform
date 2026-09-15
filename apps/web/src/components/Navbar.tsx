import React from 'react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemReady: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, systemReady, mobileOpen, onMobileClose }) => {
  const mainNav = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, desc: 'Overview & metrics' },
    { id: 'scan', label: 'New Inspection', icon: ScanIcon, desc: 'Upload & verify', primary: true },
    { id: 'history', label: 'Inspection History', icon: HistoryIcon, desc: 'Audit ledger' },
    { id: 'rules', label: 'Legal Rules', icon: RulesIcon, desc: 'PCR 2011 registry' },
  ];

  const analysisNav = [
    { id: 'compliance', label: 'Compliance', icon: CheckIcon, disabled: true },
    { id: 'tampering', label: 'Tampering Detection', icon: ShieldIcon, disabled: true },
    { id: 'nutrition', label: 'Nutrition Analysis', icon: BeakerIcon, disabled: true },
  ];

  const reportNav = [
    { id: 'reports', label: 'Reports', icon: FileIcon, disabled: true },
    { id: 'export', label: 'Export Center', icon: ExportIcon, disabled: true },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[268px] shrink-0 flex-col bg-surface border-r border-border">
        <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} mainNav={mainNav} analysisNav={analysisNav} reportNav={reportNav} systemReady={systemReady} />
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-[300px] bg-surface border-r border-border shadow-soft-lg flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-[64px] border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ink text-white flex items-center justify-center">
              <span className="text-[13px] font-bold">L</span>
            </div>
            <div className="leading-none">
              <div className="text-[13px] font-semibold tracking-tight">LabelCheck AI</div>
              <div className="text-[10px] text-ink-tertiary">Inspect smarter</div>
            </div>
          </div>
          <button onClick={onMobileClose} className="p-2 -mr-2 rounded-lg hover:bg-surface-hover border border-transparent hover:border-border">
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SidebarContent activeTab={activeTab} setActiveTab={setActiveTab} mainNav={mainNav} analysisNav={analysisNav} reportNav={reportNav} systemReady={systemReady} />
        </div>
      </aside>
    </>
  );
};

function SidebarContent({ activeTab, setActiveTab, mainNav, analysisNav, reportNav, systemReady }: any) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center shadow-soft">
            <span className="text-[14px] font-bold tracking-tight">LC</span>
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold tracking-tight leading-none">LabelCheck AI</div>
            <div className="text-[11px] text-ink-secondary leading-tight mt-1">Inspect smarter. Verify faster.</div>
            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-light border border-accent-subtle text-[10px] font-medium text-accent">
              <span className={`w-1.5 h-1.5 rounded-full ${systemReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              PCR 2011 • Enterprise
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
        {/* MAIN */}
        <div>
          <div className="px-2 mb-2 text-[10px] font-semibold tracking-widest text-ink-tertiary uppercase">Main</div>
          <div className="space-y-1">
            {mainNav.map((item: any) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-left transition-all border ${
                    isActive
                      ? 'bg-ink text-white border-ink shadow-soft'
                      : item.primary
                      ? 'bg-surface border-border hover:border-border-strong hover:bg-surface-hover text-ink'
                      : 'bg-transparent border-transparent hover:bg-surface-hover text-ink-secondary hover:text-ink'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center border ${isActive ? 'bg-white/10 border-white/10 text-white' : 'bg-surface-subtle border-border text-ink-tertiary'}`}>
                    <item.icon active={isActive} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className={`block text-[13px] font-medium leading-none ${isActive ? 'text-white' : 'text-ink'}`}>{item.label}</span>
                    <span className={`block text-[11px] mt-1 leading-none ${isActive ? 'text-white/60' : 'text-ink-tertiary'}`}>{item.desc}</span>
                  </span>
                  {item.primary && !isActive && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ANALYSIS */}
        <div>
          <div className="px-2 mb-2 text-[10px] font-semibold tracking-widest text-ink-tertiary uppercase">Analysis</div>
          <div className="space-y-1">
            {analysisNav.map((item: any) => (
              <div
                key={item.id}
                className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left border border-transparent opacity-60"
                title="Available within inspection detail view"
              >
                <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-surface-subtle border border-border-subtle text-ink-tertiary">
                  <item.icon />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[12px] font-medium text-ink-secondary leading-none">{item.label}</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-subtle border border-border-subtle text-ink-tertiary">Detail</span>
              </div>
            ))}
          </div>
        </div>

        {/* REPORTS */}
        <div>
          <div className="px-2 mb-2 text-[10px] font-semibold tracking-widest text-ink-tertiary uppercase">Reports</div>
          <div className="space-y-1">
            {reportNav.map((item: any) => (
              <div key={item.id} className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg border border-transparent opacity-60">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-surface-subtle border border-border-subtle text-ink-tertiary">
                  <item.icon />
                </span>
                <span className="text-[12px] font-medium text-ink-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info card */}
        <div className="mx-2 p-3 rounded-xl bg-canvas border border-border-subtle">
          <div className="text-[11px] font-semibold text-ink">How verification works</div>
          <div className="mt-1.5 space-y-1.5 text-[11px] text-ink-secondary leading-relaxed">
            <div className="flex gap-2"><span className="text-ink-tertiary">1.</span><span>Upload label image</span></div>
            <div className="flex gap-2"><span className="text-ink-tertiary">2.</span><span>OCR extracts declarations</span></div>
            <div className="flex gap-2"><span className="text-ink-tertiary">3.</span><span>Rules verify compliance</span></div>
            <div className="flex gap-2"><span className="text-ink-tertiary">4.</span><span>Evidence-backed report</span></div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="p-3 border-t border-border-subtle space-y-3">
        <div className="px-2 flex items-center gap-2 text-[11px] text-ink-tertiary">
          <div className={`w-2 h-2 rounded-full ${systemReady ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          <span>{systemReady ? 'Compliance engine active' : 'Engine connecting...'}</span>
        </div>
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-surface-subtle border border-border-subtle">
          <div className="w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center text-[11px] font-semibold">EO</div>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium leading-none">Enforcement Officer</div>
            <div className="text-[10px] text-ink-tertiary leading-none mt-1">officer@legalmetrology.gov.in</div>
          </div>
        </div>
        <div className="px-2 text-[10px] text-ink-tertiary leading-relaxed">
          Govt. of India • Ministry of Consumer Affairs • Legal Metrology Dept.
        </div>
      </div>
    </div>
  );
}

// Icons – minimal stroke, professional
function DashboardIcon({ active }: { active?: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function ScanIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      <path d="M12 8V6M12 18v-2M8 12H6M18 12h-2M9.5 9.5 8 8M16 16l-1.5-1.5M16 8l-1.5 1.5M8 16l1.5-1.5" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 12a9 9 0 1 0 9-9" />
      <path d="M3 3v6h6" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}
function RulesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}
function BeakerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 3H15" />
      <path d="M10 3v5l-4 11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1L14 8V3" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}
