import React, { useEffect, useState } from 'react';
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

  const metrics = [
    {
      label: 'Total Inspections',
      value: summary?.total_scans ?? 0,
      sub: 'Registered package scans',
      accent: 'ink',
    },
    {
      label: 'Compliant',
      value: summary?.pass_count ?? 0,
      sub: 'All declarations verified',
      accent: 'success',
    },
    {
      label: 'Needs Review',
      value: summary?.review_required_count ?? 0,
      sub: 'Requires officer verification',
      accent: 'warning',
    },
    {
      label: 'Non-Compliant',
      value: summary?.fail_count ?? 0,
      sub: 'Contraventions under PCR',
      accent: 'danger',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-ink leading-tight">Compliance Overview</h2>
          <p className="text-[13px] text-ink-secondary mt-1.5 max-w-2xl leading-relaxed">
            Monitor product inspections and label verification results. AI extracts declarations, deterministic rules verify compliance with evidence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-ink-tertiary">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Live enforcement jurisdiction
          </div>
          <button
            onClick={onStartNewScan}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink text-white text-[13px] font-medium rounded-lg border border-ink hover:bg-black transition-colors shadow-soft"
          >
            <span className="text-[14px]">+</span>
            <span>New Inspection</span>
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-surface border border-border rounded-xl p-4 shadow-soft">
            <div className="flex items-start justify-between">
              <div className="text-[11px] font-semibold tracking-widest uppercase text-ink-tertiary">{m.label}</div>
              <div className={`w-2 h-2 rounded-full mt-1 ${m.accent === 'success' ? 'bg-emerald-500' : m.accent === 'warning' ? 'bg-amber-500' : m.accent === 'danger' ? 'bg-red-500' : 'bg-ink-tertiary'}`} />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[28px] font-semibold tracking-tight text-ink leading-none">
                {loading ? '—' : m.value}
              </span>
              {m.label === 'Compliant' && summary && (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-success-bg border border-success-border text-success font-medium">
                  {summary.compliance_rate_percent}% rate
                </span>
              )}
            </div>
            <div className="mt-1.5 text-[11px] text-ink-secondary">{m.sub}</div>
            <div className="mt-3 h-1 rounded-full bg-surface-subtle overflow-hidden">
              <div
                className={`h-full rounded-full ${m.accent === 'success' ? 'bg-emerald-600' : m.accent === 'warning' ? 'bg-amber-500' : m.accent === 'danger' ? 'bg-red-500' : 'bg-ink'}`}
                style={{ width: `${Math.min(100, m.value === 0 ? 0 : 40 + m.value * 8)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Principle + recent */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Principle */}
        <div className="lg:col-span-4">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-soft h-full">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-accent-light border border-accent-subtle flex items-center justify-center text-accent">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
              </div>
              <div className="text-[11px] font-semibold tracking-widest uppercase text-ink-tertiary">Operational Invariant</div>
            </div>
            <div className="text-[13px] font-medium text-ink leading-relaxed">
              AI extracts and measures. Deterministic rules decide compliance.
            </div>
            <div className="text-[12px] text-ink-secondary leading-relaxed mt-2">
              Perception extracts text, bounding boxes, and visual dimensions. The authoritative Rule Engine evaluates PCR 2011 rules. Every finding is supported by visual evidence.
            </div>
            <div className="mt-4 pt-4 border-t border-border-subtle grid grid-cols-3 gap-2 text-[11px]">
              <div><div className="font-mono font-semibold text-ink">12</div><div className="text-ink-tertiary">Rules enforced</div></div>
              <div><div className="font-mono font-semibold text-ink">{summary?.enforcement_jurisdiction ? 'Gov' : 'PCR'}</div><div className="text-ink-tertiary">Jurisdiction</div></div>
              <div><div className="font-mono font-semibold text-ink">3-4s</div><div className="text-ink-tertiary">Avg pipeline</div></div>
            </div>
          </div>
        </div>

        {/* Recent inspections */}
        <div className="lg:col-span-8">
          <div className="bg-surface border border-border rounded-xl shadow-soft overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-ink">Recent Inspections</div>
                <div className="text-[11px] text-ink-tertiary mt-0.5">Latest packaged commodities submitted for scanning</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-1 rounded-full bg-surface-subtle border border-border text-ink-tertiary">{scans.length} records</span>
              </div>
            </div>

            {scans.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 mx-auto rounded-xl bg-surface-subtle border border-border flex items-center justify-center text-ink-tertiary mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /></svg>
                </div>
                <div className="text-[13px] font-medium text-ink">No inspection scans recorded yet</div>
                <div className="text-[11px] text-ink-secondary mt-1">Upload a packaged commodity image to begin automated verification.</div>
                <button onClick={onStartNewScan} className="mt-4 px-3 py-1.5 bg-surface border border-border rounded-lg text-[12px] font-medium hover:border-border-strong">
                  Upload First Package
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-subtle/60 border-b border-border-subtle text-[10px] font-semibold tracking-widest uppercase text-ink-tertiary">
                      <th className="px-5 py-2.5 font-semibold">Scan Number</th>
                      <th className="px-5 py-2.5 font-semibold">Commodity</th>
                      <th className="px-5 py-2.5 font-semibold">Verdict</th>
                      <th className="px-5 py-2.5 font-semibold">Status</th>
                      <th className="px-5 py-2.5 font-semibold">Timestamp</th>
                      <th className="px-5 py-2.5 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {scans.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="px-5 py-3 font-mono text-[11px] font-medium text-ink">{s.scan_number}</td>
                        <td className="px-5 py-3 text-[12px] text-ink-secondary">{s.commodity_type.replace(/_/g, ' ')}</td>
                        <td className="px-5 py-3"><StatusBadge status={s.overall_verdict} size="sm" /></td>
                        <td className="px-5 py-3"><span className="inline-flex px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[10px] font-mono text-ink-tertiary">{s.status}</span></td>
                        <td className="px-5 py-3 text-[11px] text-ink-tertiary">{new Date(s.created_at).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => onViewScan(s.id)} className="text-[11px] font-medium text-ink hover:text-black underline decoration-border-strong underline-offset-4">
                            View
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
      </div>

      {/* Footer workflow hint */}
      <div className="bg-surface-subtle border border-border-subtle rounded-xl p-4 flex flex-wrap items-center gap-3 text-[11px] text-ink-secondary">
        <span className="font-medium text-ink">Workflow:</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[10px]">1</span> Upload</span>
        <span className="text-ink-tertiary">→</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[10px]">2</span> Analyze</span>
        <span className="text-ink-tertiary">→</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[10px]">3</span> Extract</span>
        <span className="text-ink-tertiary">→</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center text-[10px]">4</span> Verify</span>
        <span className="text-ink-tertiary">→</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center text-[10px]">5</span> Result</span>
      </div>
    </div>
  );
};
