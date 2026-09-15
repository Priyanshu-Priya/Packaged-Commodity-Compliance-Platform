import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertOctagon, HelpCircle, FileText, ArrowUpRight, Scale, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { DashboardSummary, ScanItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface DashboardViewProps {
  onStartNewScan: () => void;
  onViewScan: (scanId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onStartNewScan, onViewScan }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [sumData, scansData] = await Promise.all([
          api.getDashboardSummary(),
          api.listScans(),
        ]);
        setSummary(sumData);
        setScans(scansData.scans);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Hero / Header Notice */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gov-800 via-gov-700 to-gov-850 p-6 md:p-8 border border-gold-500/20 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-gold-500/20">
              <Scale className="w-3.5 h-3.5" />
              <span>Statutory Compliance Monitor</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Legal Metrology Enforcement Command
            </h1>
            <p className="mt-1 text-sm md:text-base text-slate-300 max-w-2xl">
              Automated examination of packaged commodities under Legal Metrology (Packaged Commodities) Rules, 2011.
              Rule-driven legal reasoning with verifiable visual evidence.
            </p>
          </div>
          <button
            onClick={onStartNewScan}
            className="self-start md:self-auto px-5 py-2.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-lg shadow-md hover:shadow-gold-500/20 transition-all flex items-center space-x-2"
          >
            <span>Scan New Package</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Inspections */}
        <div className="glass-panel rounded-xl p-5 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Inspections</span>
            <FileText className="w-5 h-5 text-sky-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-white font-mono">
            {loading ? '-' : summary?.total_scans ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total registered package scans</p>
        </div>

        {/* Compliant (Pass) */}
        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Compliant (Pass)</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-400 font-mono">
            {loading ? '-' : summary?.pass_count ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">All mandatory declarations verified</p>
        </div>

        {/* Non-Compliant (Violations) */}
        <div className="glass-panel rounded-xl p-5 border border-rose-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Violations Detected</span>
            <AlertOctagon className="w-5 h-5 text-rose-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-rose-400 font-mono">
            {loading ? '-' : summary?.fail_count ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">Contraventions under PCR, 2011</p>
        </div>

        {/* Review Required */}
        <div className="glass-panel rounded-xl p-5 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Review Required</span>
            <HelpCircle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-amber-400 font-mono">
            {loading ? '-' : summary?.review_required_count ?? 0}
          </p>
          <p className="mt-1 text-xs text-slate-400">Ambiguous / uncalibrated scales</p>
        </div>
      </div>

      {/* Core Principle Invariant Card */}
      <div className="glass-panel rounded-xl p-6 border-l-4 border-l-gold-500">
        <h3 className="text-sm font-bold text-gold-400 uppercase tracking-wider flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Core Operational Invariant</span>
        </h3>
        <p className="mt-2 text-sm text-slate-300 leading-relaxed">
          <strong className="text-white">AI extracts and measures. Deterministic rules decide compliance.</strong> Under Legal Metrology regulations, automated predictions never directly penalize a manufacturer. The perception subsystem extracts declarations and visual dimensions; the authoritative Rule Engine evaluates statutory rules; and every potential non-compliance is supported by visual bounding box evidence.
        </p>
      </div>

      {/* Recent Inspections Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-700/60">
        <div className="px-6 py-4 border-b border-slate-700/60 flex items-center justify-between bg-gov-850">
          <div>
            <h2 className="text-base font-bold text-white">Recent Compliance Inspections</h2>
            <p className="text-xs text-slate-400">Latest packaged commodities submitted for scanning</p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-gov-800 px-2.5 py-1 rounded border border-slate-700">
            {scans.length} records
          </span>
        </div>

        {scans.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Scale className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <p className="text-base font-semibold text-slate-300">No inspection scans recorded yet.</p>
            <p className="text-xs mt-1">Upload a packaged commodity image to begin automated verification.</p>
            <button
              onClick={onStartNewScan}
              className="mt-4 px-4 py-2 bg-gov-700 hover:bg-gov-600 text-white text-xs font-semibold rounded-lg border border-gold-500/30 transition-all"
            >
              Upload First Package
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-gov-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="px-6 py-3">Scan Number</th>
                  <th className="px-6 py-3">Commodity</th>
                  <th className="px-6 py-3">Verdict</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {scans.map((s) => (
                  <tr key={s.id} className="hover:bg-gov-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-gold-300">{s.scan_number}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-200">{s.commodity_type}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.overall_verdict} size="sm" />
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onViewScan(s.id)}
                        className="text-xs text-gold-400 hover:text-gold-300 font-semibold underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
