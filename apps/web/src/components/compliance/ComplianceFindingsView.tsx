import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  Filter, Download, UserCheck, Eye, EyeOff, Scale, History,
  ChevronDown, ChevronUp
} from 'lucide-react';
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
    } catch {
      // Ignore if no logs
    }
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
      showToast(`Rule ${selectedFinding.source_rule} status updated to ${reviewStatus}`);
      await loadLogs();
      onFindingsUpdated();
    } catch (err: any) {
      alert(err.message || 'Failed to submit officer review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const filteredFindings = findings.filter(f => {
    if (filter === 'ALL') return true;
    return f.status === filter;
  });

  const passCount = findings.filter(f => f.status === 'PASS').length;
  const failCount = findings.filter(f => f.status === 'FAIL').length;
  const reviewCount = findings.filter(f => f.status === 'REVIEW_REQUIRED').length;

  const currentVerdict = overallVerdict || (failCount > 0 ? 'FAIL' : reviewCount > 0 ? 'REVIEW_REQUIRED' : 'PASS');

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-emerald-600 text-white shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-fade-in border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Statutory Verdict Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        currentVerdict === 'PASS'
          ? 'bg-gradient-to-br from-emerald-950/40 via-gov-900/80 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
          : currentVerdict === 'FAIL'
          ? 'bg-gradient-to-br from-rose-950/40 via-gov-900/80 to-slate-900 border-rose-500/40 shadow-lg shadow-rose-950/20'
          : 'bg-gradient-to-br from-amber-950/40 via-gov-900/80 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-950/20'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className={`p-3.5 rounded-xl flex-shrink-0 ${
              currentVerdict === 'PASS'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : currentVerdict === 'FAIL'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {currentVerdict === 'PASS' ? (
                <ShieldCheck className="w-8 h-8" />
              ) : currentVerdict === 'FAIL' ? (
                <ShieldAlert className="w-8 h-8" />
              ) : (
                <AlertTriangle className="w-8 h-8" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Statutory Verdict</span>
                <StatusBadge status={currentVerdict} size="sm" />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {currentVerdict === 'PASS' && 'FULLY COMPLIANT WITH LEGAL METROLOGY RULES, 2011'}
                {currentVerdict === 'FAIL' && 'STATUTORY VIOLATION IDENTIFIED — ENFORCEMENT ACTION REQUIRED'}
                {currentVerdict === 'REVIEW_REQUIRED' && 'PHYSICAL GAUGE / OFFICER ADJUDICATION REQUIRED'}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                {currentVerdict === 'PASS' && 'All mandatory declarations under Chapter II (Rules 6, 7, 8, 9, 10) have been detected and verified within statutory thresholds.'}
                {currentVerdict === 'FAIL' && 'One or more mandatory declarations are missing, non-compliant, or have suspected substrate alterations under Legal Metrology Rules, 2011.'}
                {currentVerdict === 'REVIEW_REQUIRED' && 'Automated perception has extracted declarations, but physical scale calibration or visual contrast verification by an Enforcement Officer is needed.'}
              </p>
            </div>
          </div>

          {/* Compliance Score & Metrics */}
          <div className="flex items-center space-x-6 lg:border-l lg:border-slate-800 lg:pl-6">
            <div className="text-center">
              <div className="text-3xl font-black text-white font-mono tracking-tight">
                {complianceScore.toFixed(1)}%
              </div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Statutory Score
              </div>
            </div>

            <div className="h-10 w-px bg-slate-800 hidden sm:block" />

            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex items-center justify-between space-x-3 text-emerald-400">
                <span>Passed Checks:</span>
                <span className="font-mono font-bold">{passCount}</span>
              </div>
              <div className="flex items-center justify-between space-x-3 text-rose-400">
                <span>Violations:</span>
                <span className="font-mono font-bold">{failCount}</span>
              </div>
              <div className="flex items-center justify-between space-x-3 text-amber-400">
                <span>Under Review:</span>
                <span className="font-mono font-bold">{reviewCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <a
              href={api.getPdfReportUrl(scanId)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Inspection Certificate (PDF)</span>
            </a>

            {annotatedImageUrl && (
              <button
                onClick={() => setShowAnnotated(!showAnnotated)}
                className="px-3.5 py-2 rounded-lg bg-gov-800 hover:bg-gov-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all flex items-center space-x-2"
              >
                {showAnnotated ? (
                  <>
                    <EyeOff className="w-4 h-4 text-gold-400" />
                    <span>View Raw Image</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>View Visual Evidence Overlay</span>
                  </>
                )}
              </button>
            )}
          </div>

          {reviewLogs.length > 0 && (
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1.5 transition-colors"
            >
              <History className="w-3.5 h-3.5 text-gold-400" />
              <span>Officer Audit Trail ({reviewLogs.length})</span>
              {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Visual Evidence Image Container */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300 font-semibold">
            <Scale className="w-4 h-4 text-gold-400" />
            <span>
              {showAnnotated && annotatedImageUrl
                ? 'Visual Evidence Overlay (Statutory Bounding Boxes Annotated)'
                : 'Primary Display Panel Capture'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {showAnnotated && annotatedImageUrl ? 'Green: Compliant • Red: Violation • Amber: Review Needed' : 'Original Resolution'}
          </span>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center max-h-[460px] border border-slate-800">
          <img
            src={showAnnotated && annotatedImageUrl ? api.getAnnotatedImageUrl(scanId) : imageUrl}
            alt={`Package Scan ${scanNumber}`}
            className="max-h-[440px] w-auto object-contain rounded-lg transition-all duration-300"
          />
        </div>
      </div>

      {/* Audit Trail Drawer (if expanded) */}
      {showLogs && reviewLogs.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-gold-500/20 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <History className="w-4 h-4 text-gold-400" />
              <span>Statutory Officer Review Audit Ledger</span>
            </h3>
            <span className="text-[11px] text-slate-400">Immutable Compliance History</span>
          </div>
          <div className="space-y-2">
            {reviewLogs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg bg-gov-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-gold-300">{log.rule_id}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-slate-400">Overridden from</span>
                    <span className="font-semibold text-slate-300">{log.previous_status}</span>
                    <span className="text-slate-400">&rarr;</span>
                    <StatusBadge status={log.updated_status} size="sm" />
                  </div>
                  <p className="text-slate-300 italic">"{log.review_notes}"</p>
                </div>
                <div className="text-right sm:flex-shrink-0 text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-200">{log.reviewer_name}</span>
                  <div>{new Date(log.reviewed_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statutory Rules Findings Matrix */}
      <div className="space-y-4">
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Filter Rules:</span>
          </div>

          <div className="flex items-center space-x-1.5 text-xs font-semibold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'ALL'
                  ? 'bg-gov-700 text-white font-bold border border-slate-600'
                  : 'text-slate-400 hover:text-white hover:bg-gov-800'
              }`}
            >
              All Rules ({findings.length})
            </button>
            <button
              onClick={() => setFilter('FAIL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'FAIL'
                  ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-gov-800'
              }`}
            >
              Violations ({failCount})
            </button>
            <button
              onClick={() => setFilter('REVIEW_REQUIRED')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'REVIEW_REQUIRED'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-amber-400 hover:bg-gov-800'
              }`}
            >
              Review Needed ({reviewCount})
            </button>
            <button
              onClick={() => setFilter('PASS')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'PASS'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                  : 'text-slate-400 hover:text-emerald-400 hover:bg-gov-800'
              }`}
            >
              Passed ({passCount})
            </button>
          </div>
        </div>

        {/* Findings List */}
        <div className="space-y-3">
          {filteredFindings.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs glass-panel rounded-xl">
              No rule findings match the selected filter.
            </div>
          ) : (
            filteredFindings.map((finding) => (
              <div
                key={finding.rule_id}
                className={`p-5 rounded-xl border transition-all glass-panel ${
                  finding.status === 'FAIL'
                    ? 'border-rose-500/40 bg-rose-950/10 hover:border-rose-500/60'
                    : finding.status === 'REVIEW_REQUIRED'
                    ? 'border-amber-500/40 bg-amber-950/10 hover:border-amber-500/60'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Rule Meta & Title */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-gov-800 text-gold-300 border border-slate-700">
                        {finding.source_rule}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold tracking-wide uppercase">
                        {finding.category.replace('_', ' ')}
                      </span>
                      <StatusBadge status={finding.status} size="sm" />
                    </div>

                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {finding.title}
                    </h4>

                    {/* Detected Value */}
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                      <span className="font-semibold text-slate-400">Detected Fact / Observation: </span>
                      <span className="font-mono text-slate-200">{finding.detected || 'Not detected'}</span>
                    </div>

                    {/* Legal Reasoning */}
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <strong className="text-slate-300">Statutory Basis:</strong> {finding.reasoning}
                    </p>

                    {/* Evidence Badges */}
                    {finding.evidence && finding.evidence.length > 0 && (
                      <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-500">
                        <span>Evidence items:</span>
                        {finding.evidence.map((ev, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-gov-800 text-slate-300 border border-slate-700 font-mono"
                          >
                            {ev.evidence_type} (Conf: {(ev.confidence * 100).toFixed(0)}%)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Adjudication Action */}
                  <div className="lg:border-l lg:border-slate-800 lg:pl-5 flex items-center justify-end">
                    <button
                      onClick={() => handleOpenReview(finding)}
                      className="px-3.5 py-2 rounded-lg bg-gov-800 hover:bg-gov-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-gold-400" />
                      <span>Adjudicate / Override</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Officer Adjudication Modal */}
      {isReviewOpen && selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg glass-panel rounded-2xl p-6 border border-gold-500/30 shadow-2xl space-y-5 bg-gov-900">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-gold-400" />
                <h3 className="text-sm font-bold text-white">
                  Officer Adjudication: {selectedFinding.source_rule}
                </h3>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-white">{selectedFinding.title}</div>
              <div className="text-slate-400">Current AI Finding: <strong className="text-slate-200">{selectedFinding.status}</strong></div>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Adjudicated Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PASS', 'FAIL', 'REVIEW_REQUIRED'] as ComplianceStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setReviewStatus(st)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                        reviewStatus === st
                          ? 'bg-gold-500 text-slate-950 border-gold-400 shadow-sm'
                          : 'bg-gov-800 text-slate-300 border-slate-700 hover:bg-gov-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Officer Name / Designation
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400 font-mono"
                  placeholder="e.g. Inspector S. Sharma, Legal Metrology"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Verification Notes &amp; Statutory Justification
                </label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-gold-400"
                  placeholder="Record physical instrument measurements, compounding notes, or basis of statutory override..."
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReviewOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview || !reviewNotes.trim()}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Record Adjudication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
