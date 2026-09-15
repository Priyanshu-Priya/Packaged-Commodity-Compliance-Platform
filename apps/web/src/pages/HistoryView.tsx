import React, { useEffect, useState } from 'react';
import { History, Search, Filter, ArrowUpRight, Scale } from 'lucide-react';
import { api } from '../services/api';
import { ScanItem } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface HistoryViewProps {
  onViewScan: (scanId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onViewScan }) => {
  const [scans, setScans] = useState<ScanItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScans() {
      try {
        const data = await api.listScans();
        setScans(data.scans);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    loadScans();
  }, []);

  const filteredScans = scans.filter((s) => {
    const matchesSearch = s.scan_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.commodity_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVerdict = verdictFilter === 'ALL' ? true : s.overall_verdict === verdictFilter;
    return matchesSearch && matchesVerdict;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-6 h-6 text-sky-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Inspection Ledger & History</h1>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            Complete immutable audit log of packaged commodity scans and compliance assessments.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center glass-panel p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by Scan Number or Commodity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gov-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-gold-500 transition-all"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="bg-gov-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold-500"
          >
            <option value="ALL">All Verdicts</option>
            <option value="PASS">Compliant (PASS)</option>
            <option value="FAIL">Non-Compliant (FAIL)</option>
            <option value="REVIEW_REQUIRED">Review Required</option>
          </select>
        </div>
      </div>

      {/* Scans Table */}
      <div className="glass-panel rounded-xl overflow-hidden border border-slate-700/60">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading inspection ledger...</div>
        ) : filteredScans.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Scale className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No matching scan records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-gov-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-700/80">
                <tr>
                  <th className="px-6 py-3">Scan Number</th>
                  <th className="px-6 py-3">Commodity</th>
                  <th className="px-6 py-3">Verdict</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredScans.map((s) => (
                  <tr key={s.id} className="hover:bg-gov-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-gold-300">{s.scan_number}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-200">{s.commodity_type}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={s.overall_verdict} size="sm" />
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {s.compliance_score != null ? `${s.compliance_score}%` : '-'}
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
                        className="text-xs text-gold-400 hover:text-gold-300 font-semibold underline inline-flex items-center space-x-1"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
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
