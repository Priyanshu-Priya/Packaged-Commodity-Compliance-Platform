import React, { useEffect, useState } from 'react';
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
    const matchesSearch = s.scan_number.toLowerCase().includes(searchQuery.toLowerCase()) || s.commodity_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVerdict = verdictFilter === 'ALL' ? true : s.overall_verdict === verdictFilter;
    return matchesSearch && matchesVerdict;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight text-ink">Inspection Ledger & History</h2>
          <p className="text-[12px] text-ink-secondary mt-1">Complete immutable audit log of packaged commodity scans and compliance assessments.</p>
        </div>
        <div className="text-[11px] text-ink-tertiary px-2.5 py-1 rounded-full bg-surface border border-border">{scans.length} total records</div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-3 shadow-soft flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative w-full sm:w-[320px]">
          <input type="text" placeholder="Search by Scan Number or Commodity…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-surface border border-border rounded-lg text-[12px] focus:outline-none focus:border-ink" />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-ink-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="6" /><path d="M21 21l-3.5-3.5" /></svg>
        </div>
        <select value={verdictFilter} onChange={(e) => setVerdictFilter(e.target.value)} className="bg-surface border border-border rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-ink">
          <option value="ALL">All Verdicts</option>
          <option value="PASS">Compliant (PASS)</option>
          <option value="FAIL">Non-Compliant (FAIL)</option>
          <option value="REVIEW_REQUIRED">Review Required</option>
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[12px] text-ink-tertiary">Loading inspection ledger…</div>
        ) : filteredScans.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-surface-subtle border border-border flex items-center justify-center text-ink-tertiary mb-2">◍</div>
            <div className="text-[13px] font-medium text-ink">No matching scan records found</div>
            <div className="text-[11px] text-ink-secondary mt-1">Adjust filters or start a new inspection.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-subtle/60 border-b border-border-subtle text-[10px] font-semibold tracking-widest uppercase text-ink-tertiary">
                  <th className="px-5 py-2.5">Scan Number</th>
                  <th className="px-5 py-2.5">Commodity</th>
                  <th className="px-5 py-2.5">Verdict</th>
                  <th className="px-5 py-2.5">Score</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Timestamp</th>
                  <th className="px-5 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredScans.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-subtle/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-[11px] font-medium text-ink">{s.scan_number}</td>
                    <td className="px-5 py-3 text-[12px] text-ink-secondary">{s.commodity_type.replace(/_/g,' ')}</td>
                    <td className="px-5 py-3"><StatusBadge status={s.overall_verdict} size="sm" /></td>
                    <td className="px-5 py-3 font-mono text-[11px] text-ink-secondary">{s.compliance_score != null ? `${s.compliance_score}%` : '—'}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[10px] font-mono text-ink-tertiary">{s.status}</span></td>
                    <td className="px-5 py-3 text-[11px] text-ink-tertiary">{new Date(s.created_at).toLocaleString()}</td>
                    <td className="px-5 py-3 text-right"><button onClick={() => onViewScan(s.id)} className="text-[11px] font-medium text-ink hover:text-black underline decoration-border-strong underline-offset-4">Inspect</button></td>
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
