import React, { useState, useEffect } from 'react';
import { ComplianceFinding, ComplianceStatus, ReviewLogItem } from '../../types';
import { StatusBadge } from '../StatusBadge';
import { api } from '../../services/api';

interface ComplianceFindingsViewProps {
  scanId: string;
  scanNumber: string;
  overallVerdict?: string;
  complianceScore?: number;
  findings: ComplianceFinding[];
  imageUrl: string;
  annotatedImageUrl?: string | null;
  onFindingsUpdated: () => void;
}

export const ComplianceFindingsView: React.FC<ComplianceFindingsViewProps> = ({
  scanId,
  scanNumber,
  overallVerdict,
  complianceScore = 0,
  findings = [],
  imageUrl,
  annotatedImageUrl,
  onFindingsUpdated,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'FAIL' | 'REVIEW_REQUIRED' | 'PASS'>('ALL');
  const [showAnnotated, setShowAnnotated] = useState<boolean>(true);
  const [selectedFinding, setSelectedFinding] = useState<ComplianceFinding | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [reviewStatus, setReviewStatus] = useState<ComplianceStatus>('PASS');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [reviewerName, setReviewerName] = useState<string>('Officer In-Charge');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewLogs, setReviewLogs] = useState<ReviewLogItem[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      const logs = await api.getScanReviews(scanId);
      setReviewLogs(logs);
    } catch {}
  };

  useEffect(() => {
    loadLogs();
  }, [scanId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenReview = (finding: ComplianceFinding) => {
    setSelectedFinding(finding);
    setReviewStatus(finding.status === 'PASS' ? 'REVIEW_REQUIRED' : 'PASS');
    setReviewNotes('');
    setIsReviewOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding || !reviewNotes.trim()) return;
    try {
      setSubmittingReview(true);
      await api.reviewFinding(scanId, {
        rule_id: selectedFinding.rule_id,
        status: reviewStatus,
        notes: reviewNotes.trim(),
        reviewer_name: reviewerName.trim() || 'Officer In-Charge'
      });
      setIsReviewOpen(false);
      showToast(`Rule ${selectedFinding.source_rule} updated to ${reviewStatus}`);
      await loadLogs();
      onFindingsUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to submit officer review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredFindings = findings.filter(f => filter === 'ALL' ? true : f.status === filter);
  const passCount = findings.filter(f => f.status === 'PASS').length;
  const failCount = findings.filter(f => f.status === 'FAIL').length;
  const reviewCount = findings.filter(f => f.status === 'REVIEW_REQUIRED').length;
  const currentVerdict = overallVerdict || (failCount > 0 ? 'FAIL' : reviewCount > 0 ? 'REVIEW_REQUIRED' : 'PASS');

  return (
    <div className="space-y-5">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-ink text-white shadow-soft-lg text-[12px] font-medium animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Verdict card */}
      <div className={`rounded-xl border p-5 shadow-soft ${
        currentVerdict === 'PASS' ? 'bg-success-bg border-success-border' :
        currentVerdict === 'FAIL' ? 'bg-danger-bg border-danger-border' :
        'bg-warning-bg border-warning-border'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              currentVerdict === 'PASS' ? 'bg-surface border-success-border text-success' :
              currentVerdict === 'FAIL' ? 'bg-surface border-danger-border text-danger' :
              'bg-surface border-warning-border text-warning'
            }`}>
              {currentVerdict === 'PASS' ? '✓' : currentVerdict === 'FAIL' ? '✕' : '!'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-ink-tertiary">Statutory Verdict</span>
                <StatusBadge status={currentVerdict} size="sm" />
              </div>
              <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-ink leading-tight">
                {currentVerdict === 'PASS' && 'Fully compliant with Legal Metrology Rules, 2011'}
                {currentVerdict === 'FAIL' && 'Statutory violation identified — enforcement action required'}
                {currentVerdict === 'REVIEW_REQUIRED' && 'Physical gauge / officer adjudication required'}
              </h2>
              <p className="text-[12px] text-ink-secondary mt-1 max-w-2xl leading-relaxed">
                {currentVerdict === 'PASS' && 'All mandatory declarations under Chapter II have been detected and verified within statutory thresholds.'}
                {currentVerdict === 'FAIL' && 'One or more mandatory declarations are missing, non-compliant, or have suspected substrate alterations.'}
                {currentVerdict === 'REVIEW_REQUIRED' && 'Automated perception extracted declarations, but physical calibration or contrast verification by officer is needed.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 lg:border-l lg:border-black/10 lg:pl-6">
            <div className="text-center">
              <div className="text-[28px] font-semibold tracking-tight text-ink leading-none">{complianceScore.toFixed(1)}%</div>
              <div className="text-[10px] font-semibold tracking-widest uppercase text-ink-tertiary mt-1">Statutory Score</div>
            </div>
            <div className="h-10 w-px bg-black/10 hidden sm:block" />
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between gap-4"><span className="text-ink-tertiary">Passed</span><span className="font-mono font-medium text-success">{passCount}</span></div>
              <div className="flex justify-between gap-4"><span className="text-ink-tertiary">Violations</span><span className="font-mono font-medium text-danger">{failCount}</span></div>
              <div className="flex justify-between gap-4"><span className="text-ink-tertiary">Under Review</span><span className="font-mono font-medium text-warning">{reviewCount}</span></div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <a href={api.getPdfReportUrl(scanId)} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 rounded-lg bg-ink text-white text-[12px] font-medium border border-ink hover:bg-black">Download Inspection Certificate (PDF)</a>
            {annotatedImageUrl && (
              <button onClick={() => setShowAnnotated(!showAnnotated)} className="px-3 py-2 rounded-lg bg-surface border border-border text-[12px] font-medium hover:border-border-strong">
                {showAnnotated ? 'View Raw Image' : 'View Evidence Overlay'}
              </button>
            )}
          </div>
          {reviewLogs.length > 0 && (
            <button onClick={() => setShowLogs(!showLogs)} className="text-[11px] font-medium text-ink-secondary hover:text-ink">
              Audit Trail ({reviewLogs.length}) {showLogs ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>

      {/* Image evidence */}
      <div className="bg-surface border border-border rounded-xl p-3 shadow-soft">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-[11px] font-semibold tracking-wide uppercase text-ink-tertiary">{showAnnotated && annotatedImageUrl ? 'Visual Evidence Overlay' : 'Primary Display Panel Capture'}</div>
          <div className="text-[10px] text-ink-tertiary">{showAnnotated && annotatedImageUrl ? 'Green: Compliant • Red: Violation • Amber: Review' : 'Original Resolution'}</div>
        </div>
        <div className="rounded-xl overflow-hidden bg-canvas border border-border-subtle flex items-center justify-center max-h-[460px]">
          <img src={showAnnotated && annotatedImageUrl ? api.getAnnotatedImageUrl(scanId) : imageUrl} alt={`Package ${scanNumber}`} className="max-h-[440px] w-auto object-contain" />
        </div>
      </div>

      {/* Audit trail */}
      {showLogs && reviewLogs.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold tracking-widest uppercase text-ink-tertiary">Officer Review Audit Ledger</div>
            <span className="text-[10px] text-ink-tertiary">Immutable history</span>
          </div>
          <div className="space-y-2">
            {reviewLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div>
                  <div className="flex items-center gap-2"><span className="font-mono font-medium text-ink">{log.rule_id}</span><span className="text-ink-tertiary">→</span><StatusBadge status={log.updated_status} size="sm" /></div>
                  <div className="text-ink-secondary italic mt-1">"{log.review_notes}"</div>
                </div>
                <div className="text-right text-[10px] text-ink-tertiary"><div className="font-medium text-ink">{log.reviewer_name}</div><div>{new Date(log.reviewed_at).toLocaleString()}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div className="text-[11px] font-semibold tracking-widest uppercase text-ink-tertiary">Rule Verification Matrix</div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-subtle border border-border-subtle">
          {[
            { id: 'ALL', label: `All (${findings.length})` },
            { id: 'FAIL', label: `Violations (${failCount})` },
            { id: 'REVIEW_REQUIRED', label: `Review (${reviewCount})` },
            { id: 'PASS', label: `Passed (${passCount})` },
          ].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id as any)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${filter === f.id ? 'bg-surface border border-border shadow-soft text-ink' : 'text-ink-secondary hover:text-ink'}`}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Findings */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-ink-tertiary bg-surface border border-border rounded-xl">No findings match filter.</div>
        ) : (
          filteredFindings.map((finding) => (
            <div key={finding.rule_id} className={`p-4 rounded-xl border bg-surface shadow-soft ${finding.status === 'FAIL' ? 'border-danger-border' : finding.status === 'REVIEW_REQUIRED' ? 'border-warning-border' : 'border-border'}`}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[10px] font-mono font-medium text-ink">{finding.source_rule}</span>
                    <span className="text-[10px] tracking-widest uppercase text-ink-tertiary">{finding.category.replace(/_/g,' ')}</span>
                    <StatusBadge status={finding.status} size="sm" />
                    <span className="text-[10px] text-ink-tertiary">Conf {(finding.confidence*100).toFixed(0)}%</span>
                  </div>
                  <h4 className="text-[13px] font-semibold text-ink">{finding.title}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-surface-subtle border border-border-subtle">
                      <div className="text-[10px] font-semibold tracking-widest uppercase text-ink-tertiary">Detected</div>
                      <div className="text-[12px] font-mono text-ink mt-1 break-words">{finding.detected || 'Not detected'}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-subtle border border-border-subtle">
                      <div className="text-[10px] font-semibold tracking-widest uppercase text-ink-tertiary">Expected</div>
                      <div className="text-[11px] text-ink-secondary mt-1 leading-relaxed">{finding.expected}</div>
                    </div>
                  </div>
                  <div className="text-[11px] text-ink-secondary leading-relaxed"><span className="font-medium text-ink">Statutory Basis:</span> {finding.reasoning}</div>
                  {finding.evidence && finding.evidence.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {finding.evidence.map((ev, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-full bg-surface border border-border text-[10px] font-mono text-ink-tertiary">{ev.evidence_type} {ev.confidence ? `${(ev.confidence*100).toFixed(0)}%` : ''}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="lg:pl-4 lg:border-l lg:border-border-subtle">
                  <button onClick={() => handleOpenReview(finding)} className="px-3 py-2 rounded-lg bg-surface border border-border text-[11px] font-medium hover:border-border-strong">Adjudicate / Override</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review modal */}
      {isReviewOpen && selectedFinding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm">
          <div className="w-full max-w-[480px] bg-surface rounded-2xl border border-border shadow-soft-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="text-[13px] font-semibold text-ink">Officer Adjudication: {selectedFinding.source_rule}</div>
              <button onClick={() => setIsReviewOpen(false)} className="w-7 h-7 rounded-lg border border-border bg-surface hover:bg-surface-hover flex items-center justify-center">✕</button>
            </div>
            <div className="text-[11px] text-ink-secondary"><div className="font-medium text-ink">{selectedFinding.title}</div><div>Current: {selectedFinding.status}</div></div>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Adjudicated Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PASS','FAIL','REVIEW_REQUIRED'] as ComplianceStatus[]).map((st) => (
                    <button key={st} type="button" onClick={() => setReviewStatus(st)} className={`py-2 px-2 rounded-lg text-[11px] font-medium border ${reviewStatus===st ? 'bg-ink text-white border-ink' : 'bg-surface border-border text-ink-secondary hover:border-border-strong'}`}>{st.replace('_',' ')}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Officer Name</label>
                <input value={reviewerName} onChange={(e)=>setReviewerName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-[12px] focus:outline-none focus:border-ink" required />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Verification Notes</label>
                <textarea rows={3} value={reviewNotes} onChange={(e)=>setReviewNotes(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-[12px] focus:outline-none focus:border-ink resize-none" placeholder="Record physical measurements, justification…" required />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
                <button type="button" onClick={()=>setIsReviewOpen(false)} className="px-3 py-2 rounded-lg text-[12px] text-ink-secondary hover:text-ink">Cancel</button>
                <button type="submit" disabled={submittingReview || !reviewNotes.trim()} className="px-4 py-2 rounded-lg bg-ink text-white text-[12px] font-medium hover:bg-black disabled:opacity-50">{submittingReview ? 'Submitting…' : 'Record Adjudication'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
