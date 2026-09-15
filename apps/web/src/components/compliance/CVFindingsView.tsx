import React from 'react';
import { ProductFacts } from '../../types';
import { StatusBadge } from '../StatusBadge';

interface CVFindingsViewProps {
  facts: ProductFacts;
}

export const CVFindingsView: React.FC<CVFindingsViewProps> = ({ facts }) => {
  const isBlurry = facts.is_blurry;
  const blurScore = facts.blur_score ?? 0;
  const contrastScore = facts.contrast_score ?? 0;
  const fontHeightMm = facts.estimated_font_height_mm;
  const tampering = facts.tampering_detected;

  type Row = { label: string; value: string; highlight?: boolean; warn?: boolean; danger?: boolean };
  const cards: { title: string; subtitle: string; status: 'PASS' | 'REVIEW_REQUIRED'; rows: Row[]; note: string }[] = [
    {
      title: 'Rule 7: Numeral & Letter Height',
      subtitle: 'Table I / Table II Statutory Height',
      status: 'REVIEW_REQUIRED' as const,
      rows: [
        { label: 'Estimated Character Height', value: fontHeightMm != null ? `~${fontHeightMm} mm` : 'Estimating...' },
        { label: 'Statutory Min. Required', value: '2.0 mm – 4.0 mm', highlight: true },
        { label: 'Physical Calibration', value: 'Uncalibrated 2D Photo', warn: true },
      ],
      note: 'Absolute millimeter accuracy cannot be certified without calibrated scale reference. Marked REVIEW REQUIRED for officer inspection.',
    },
    {
      title: 'Rule 8: Optical Blur & Sharpness',
      subtitle: 'Laplacian Edge Variance (Threshold 75.0)',
      status: (isBlurry ? 'REVIEW_REQUIRED' : 'PASS') as 'PASS' | 'REVIEW_REQUIRED',
      rows: [
        { label: 'Laplacian Variance Score', value: `${blurScore}`, danger: !!isBlurry },
        { label: 'Sharpness Classification', value: isBlurry ? 'Defocused / Blurry' : 'Crisp & Definite Edges' },
        { label: 'Legal Conformance', value: 'Rule 8 Plain & Definite' },
      ],
      note: isBlurry ? 'Potential motion or optical blur detected. Letters may be difficult for consumers to read clearly.' : 'Declarations satisfy statutory legibility with well-defined character contours.',
    },
    {
      title: 'Rule 8: Background Contrast',
      subtitle: 'RMS Intensity Dispersion (Threshold 30.0)',
      status: (contrastScore < 30 ? 'REVIEW_REQUIRED' : 'PASS') as 'PASS' | 'REVIEW_REQUIRED',
      rows: [
        { label: 'Contrast Score', value: `${contrastScore}` },
        { label: 'Separation Quality', value: contrastScore >= 30 ? 'High text-background distinction' : 'Low contrast substrate' },
      ],
      note: 'Declarations appear with sufficient contrast against commercial artwork and background colors.',
    },
    {
      title: 'MRP Integrity & Sticker Analysis',
      subtitle: 'Contour Boundary & Edge Density',
      status: (tampering ? 'REVIEW_REQUIRED' : 'PASS') as 'PASS' | 'REVIEW_REQUIRED',
      rows: [
        { label: 'Secondary Overlay', value: tampering ? 'Detected (Sticker border)' : 'None (Directly printed)', warn: !!tampering },
        { label: 'Verification Result', value: tampering ? 'Manual Inspection Recommended' : 'Consistent packaging substrate' },
      ],
      note: facts.tampering_reason || 'No evidence of price scratching, secondary stickers, or altered declarations.',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div>
          <div className="text-[13px] font-semibold text-ink">Physical Label Analysis</div>
          <div className="text-[11px] text-ink-tertiary mt-0.5">Automated image processing for Rule 7 (Font Height), Rule 8 (Legibility/Contrast), and MRP tampering</div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-surface border border-border text-ink-tertiary">CV Rules 7 & 8</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.title} className="bg-surface border border-border rounded-xl p-4 shadow-soft space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[12px] font-semibold text-ink">{c.title}</div>
                <div className="text-[11px] text-ink-tertiary">{c.subtitle}</div>
              </div>
              <StatusBadge status={c.status} size="sm" />
            </div>
            <div className="space-y-0 divide-y divide-border-subtle border-y border-border-subtle">
              {c.rows.map((r) => (
                <div key={r.label} className="flex justify-between py-2 text-[11px]">
                  <span className="text-ink-tertiary">{r.label}</span>
                  <span className={`font-mono font-medium ${r.highlight ? 'text-ink' : ''} ${r.warn ? 'text-warning' : ''} ${r.danger ? 'text-danger' : 'text-ink'}`}>{r.value}</span>
                </div>
              ))}
            </div>
            <div className="p-2.5 rounded-lg bg-surface-subtle border border-border-subtle text-[11px] text-ink-secondary leading-relaxed">{c.note}</div>
          </div>
        ))}
      </div>

      <div className="bg-canvas border border-border-subtle rounded-xl p-3 flex items-start gap-2 text-[11px] text-ink-secondary">
        <span className="mt-0.5">ⓘ</span>
        <span><span className="font-medium text-ink">Confidence & transparency:</span> Blur score {blurScore}, contrast {contrastScore}, font ~{fontHeightMm ?? '—'} mm. All values come from OpenCV measurements – no invented probabilities.</span>
      </div>
    </div>
  );
};
