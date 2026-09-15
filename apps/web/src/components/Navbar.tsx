import React from 'react';
import { Shield, FileCheck, History, BookOpen, UploadCloud } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  systemReady: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, systemReady }) => {
  return (
    <header className="border-b border-gold-500/20 bg-gov-850/95 backdrop-blur sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Header */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-500 to-amber-600 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-gov-900 rounded-[7px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-gold-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-white tracking-wide uppercase">Legal Metrology</span>
                <span className="text-xs px-2 py-0.5 rounded bg-gold-500/10 text-gold-400 font-mono font-semibold border border-gold-500/30">
                  PCR 2011
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-tight font-medium">
                Packaged Commodity Compliance Platform
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gov-700 text-white shadow-inner border border-gold-500/30'
                  : 'text-slate-300 hover:bg-gov-800 hover:text-white'
              }`}
            >
              <FileCheck className="w-4 h-4 text-gold-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'scan'
                  ? 'bg-gov-700 text-white shadow-inner border border-gold-500/30'
                  : 'text-slate-300 hover:bg-gov-800 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>New Inspection</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-gov-700 text-white shadow-inner border border-gold-500/30'
                  : 'text-slate-300 hover:bg-gov-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4 text-sky-400" />
              <span>History Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'rules'
                  ? 'bg-gov-700 text-white shadow-inner border border-gold-500/30'
                  : 'text-slate-300 hover:bg-gov-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Legal Rules (2011)</span>
            </button>
          </nav>

          {/* System Status Pill */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gov-800 border border-slate-700/80 text-xs">
              <span className={`w-2 h-2 rounded-full ${systemReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">
                {systemReady ? 'Engine Active' : 'Connecting...'}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-gold-400/90 font-mono text-[11px]">v2023 Ruleset</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
