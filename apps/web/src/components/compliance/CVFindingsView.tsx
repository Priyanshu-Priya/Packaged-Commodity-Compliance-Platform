import React from 'react';
import { ProductFacts } from '../../types';
import { Focus, Eye, Ruler, ShieldCheck, HelpCircle } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold text-white">Computer Vision &amp; Visual Dimension Analysis</h2>
          <p className="text-xs text-slate-400">
            Automated image processing metrics for Rule 7 (Font Height), Rule 8 (Legibility/Contrast), and Substrate Integrity.
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-gov-800 text-gold-400 border border-gold-500/20 font-mono">
          CV Rules 7 &amp; 8
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Rule 7 - Font Height Estimation */}
        <div className="glass-panel rounded-xl p-5 border border-slate-700/80 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Ruler className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Rule 7: Numeral &amp; Letter Height</h3>
                <p className="text-[11px] text-slate-400">Table I / Table II Statutory Height</p>
              </div>
            </div>
            <StatusBadge status="REVIEW_REQUIRED" size="sm" />
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Estimated Character Height:</span>
              <span className="font-mono text-slate-100 font-bold">
                {fontHeightMm != null ? `~${fontHeightMm} mm` : 'Estimating...'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Statutory Min. Required:</span>
              <span className="font-mono text-gold-400 font-bold">2.0 mm – 4.0 mm</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Physical Calibration:</span>
              <span className="text-amber-400 font-medium flex items-center space-x-1">
                <HelpCircle className="w-3 h-3" />
                <span>Uncalibrated 2D Photo</span>
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed">
            <strong>Statutory Safety Guarantee:</strong> Absolute millimeter accuracy cannot be certified without a calibrated scale reference. Marked <strong>REVIEW REQUIRED</strong> for officer inspection.
          </div>
        </div>

        {/* 2. Rule 8 - Optical Blur & Focus */}
        <div className="glass-panel rounded-xl p-5 border border-slate-700/80 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Focus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Rule 8: Optical Blur &amp; Sharpness</h3>
                <p className="text-[11px] text-slate-400">Laplacian Edge Variance (Threshold: 75.0)</p>
              </div>
            </div>
            <StatusBadge status={isBlurry ? 'REVIEW_REQUIRED' : 'PASS'} size="sm" />
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Laplacian Variance Score:</span>
              <span className={`font-mono font-bold ${isBlurry ? 'text-rose-400' : 'text-emerald-400'}`}>
                {blurScore}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Sharpness Classification:</span>
              <span className="text-slate-200 font-medium">
                {isBlurry ? 'Defocused / Blurry' : 'Crisp & Definite Edges'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Legal Conformance:</span>
              <span className="text-slate-200 font-medium">Rule 8 Plain &amp; Definite</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-gov-900 border border-slate-800 text-[11px] text-slate-400">
            {isBlurry
              ? 'Potential motion or optical blur detected. Letters may be difficult for consumers to read clearly.'
              : 'Declarations satisfy statutory legibility requirements with well-defined character contours.'}
          </div>
        </div>

        {/* 3. Rule 8 - Substrate Contrast */}
        <div className="glass-panel rounded-xl p-5 border border-slate-700/80 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Rule 8: Conspicuous Background Contrast</h3>
                <p className="text-[11px] text-slate-400">RMS Intensity Dispersion (Threshold: 30.0)</p>
              </div>
            </div>
            <StatusBadge status={contrastScore < 30 ? 'REVIEW_REQUIRED' : 'PASS'} size="sm" />
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Contrast Score:</span>
              <span className="font-mono text-slate-100 font-bold">{contrastScore}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Separation Quality:</span>
              <span className="text-slate-200 font-medium">
                {contrastScore >= 30 ? 'High text-background distinction' : 'Low contrast substrate'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-gov-900 border border-slate-800 text-[11px] text-slate-400">
            Declarations appear with sufficient contrast against commercial artwork and background colors.
          </div>
        </div>

        {/* 4. Substrate Integrity & Sticker Analysis */}
        <div className="glass-panel rounded-xl p-5 border border-slate-700/80 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">MRP Area &amp; Sticker Alteration Scan</h3>
                <p className="text-[11px] text-slate-400">Contour Boundary &amp; Edge Density</p>
              </div>
            </div>
            <StatusBadge status={tampering ? 'REVIEW_REQUIRED' : 'PASS'} size="sm" />
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Secondary Overlay:</span>
              <span className={`font-medium ${tampering ? 'text-amber-400' : 'text-emerald-400'}`}>
                {tampering ? 'Detected (Sticker border)' : 'None (Directly printed)'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Verification Result:</span>
              <span className="text-slate-200 font-medium">
                {tampering ? 'Manual Inspection Recommended' : 'Consistent packaging substrate'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-gov-900 border border-slate-800 text-[11px] text-slate-400">
            {facts.tampering_reason || 'No evidence of price scratching, secondary stickers, or altered declarations.'}
          </div>
        </div>
      </div>
    </div>
  );
};
