import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ComplianceFindingsView } from '../components/compliance/ComplianceFindingsView';
import { OCRVisualizer } from '../components/scan/OCRVisualizer';
import { FactsSheet } from '../components/compliance/FactsSheet';
import { CVFindingsView } from '../components/compliance/CVFindingsView';
import { StatusBadge } from '../components/StatusBadge';

interface ScanDetailViewProps {
  scanId: string;
  onBack: () => void;
}

export const ScanDetailView: React.FC<ScanDetailViewProps> = ({ scanId, onBack }) => {
  const [scan, setScan] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'compliance' | 'facts' | 'cv' | 'ocr'>('compliance');

  const loadScan = async () => {
    try {
      setLoading(true);
      const data = await api.getScanDetails(scanId);
      setScan(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load scan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScan();
  }, [scanId]);

  const handleRunPipeline = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      await api.analyzeScan(scanId);
      await loadScan();
      setActiveTab('compliance');
    } catch (err: any) {
      setError(err.message || 'Failed to execute Legal Metrology pipeline');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-2 border-border border-t-ink rounded-full animate-spin mx-auto" />
        <p className="text-[12px] text-ink-secondary mt-3">Loading package inspection records…</p>
      </div>
    );
  }

  if (error || !scan) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-secondary hover:text-ink">
          <span>←</span> Back to Ledger
        </button>
        <div className="p-4 rounded-xl bg-danger-bg border border-danger-border text-danger text-[12px] flex gap-2.5">
          <span>⚠</span><span>{error || 'Scan not found.'}</span>
        </div>
      </div>
    );
  }

  const hasAnalysis = scan.status === 'COMPLETED' || (scan.findings && scan.findings.length > 0);
  const hasFacts = !!scan.facts;

  return (
    <div className="space-y-5">
      {/* Case header */}
      <div className="bg-surface border border-border rounded-xl p-4 shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button onClick={onBack} className="p-2 rounded-lg border border-border bg-surface hover:bg-surface-hover text-ink-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[14px] font-semibold font-mono tracking-tight text-ink">{scan.scan_number}</h1>
              <StatusBadge status={scan.overall_verdict || scan.status} size="sm" />
              {scan.compliance_score != null && (
                <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[11px] font-mono font-medium text-ink">{scan.compliance_score.toFixed(1)}% Score</span>
              )}
              <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[10px] text-ink-tertiary">{scan.commodity_type.replace(/_/g,' ')}</span>
            </div>
            <div className="text-[11px] text-ink-tertiary mt-1">
              PCR 2011 (Amended 2023) • Scanned {new Date(scan.created_at).toLocaleString()} • Ruleset {scan.ruleset_version}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!hasAnalysis ? (
            <button onClick={handleRunPipeline} disabled={analyzing} className={`px-4 py-2 rounded-lg text-[12px] font-medium border ${analyzing ? 'bg-surface-subtle text-ink-tertiary border-border-subtle' : 'bg-ink text-white border-ink hover:bg-black'}`}>
              {analyzing ? 'Executing pipeline…' : 'Run Verification Pipeline'}
            </button>
          ) : (
            <>
              <a href={api.getPdfReportUrl(scanId)} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg bg-ink text-white text-[12px] font-medium border border-ink hover:bg-black">
                Inspection PDF
              </a>
              <button onClick={handleRunPipeline} disabled={analyzing} className="px-3 py-2 rounded-lg bg-surface border border-border text-[12px] font-medium hover:border-border-strong">
                {analyzing ? 'Re-verifying…' : 'Re-verify'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      {hasAnalysis && (
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-subtle border border-border-subtle w-fit overflow-x-auto">
          {[
            { id: 'compliance', label: `Compliance Audit (${scan.findings?.length || 0})` },
            { id: 'facts', label: 'Facts Sheet' },
            { id: 'cv', label: 'CV Measurements' },
            { id: 'ocr', label: `OCR Visualizer (${scan.ocr_result?.tokens?.length || 0})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-surface border border-border shadow-soft text-ink' : 'text-ink-secondary hover:text-ink'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {hasAnalysis ? (
        activeTab === 'compliance' ? (
          <ComplianceFindingsView
            scanId={scan.id}
            scanNumber={scan.scan_number}
            overallVerdict={scan.overall_verdict}
            complianceScore={scan.compliance_score || 0}
            findings={scan.findings || []}
            imageUrl={scan.image_url}
            annotatedImageUrl={scan.annotated_image_url}
            onFindingsUpdated={loadScan}
          />
        ) : activeTab === 'facts' && hasFacts ? (
          <FactsSheet facts={scan.facts} />
        ) : activeTab === 'cv' && hasFacts ? (
          <CVFindingsView facts={scan.facts} />
        ) : (
          <OCRVisualizer imageUrl={scan.image_url} ocrResult={scan.ocr_result} />
        )
      ) : (
        <div className="bg-surface border border-border rounded-xl p-12 text-center shadow-soft">
          <div className="w-12 h-12 rounded-xl bg-surface-subtle border border-border flex items-center justify-center mx-auto text-ink-tertiary mb-3">◍</div>
          <div className="text-[14px] font-semibold text-ink">Verification Engine Ready</div>
          <div className="text-[12px] text-ink-secondary mt-1 max-w-md mx-auto leading-relaxed">Package photograph uploaded and integrity verified. Execute the end-to-end Legal Metrology pipeline: OCR → Facts → CV → Rule Evaluation → Scoring.</div>
          <button onClick={handleRunPipeline} disabled={analyzing} className="mt-5 px-4 py-2 bg-ink text-white text-[12px] font-medium rounded-lg hover:bg-black">Execute Verification Pipeline</button>
        </div>
      )}
    </div>
  );
};
