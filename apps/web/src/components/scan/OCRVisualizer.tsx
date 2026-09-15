import React, { useState } from 'react';
import { OCRResult } from '../../types';

interface OCRVisualizerProps {
  imageUrl: string;
  ocrResult: OCRResult;
}

export const OCRVisualizer: React.FC<OCRVisualizerProps> = ({ imageUrl, ocrResult }) => {
  const [hoveredTokenIndex, setHoveredTokenIndex] = useState<number | null>(null);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);
  const [showBBoxes, setShowBBoxes] = useState<boolean>(true);
  const [showOrderBadges, setShowOrderBadges] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'tokens' | 'fulltext'>('tokens');

  const filteredTokens = ocrResult.tokens.filter((t) => t.text.toLowerCase().includes(searchFilter.toLowerCase()));

  return (
    <div className="bg-surface border border-border rounded-xl shadow-soft p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
        <div>
          <div className="text-[13px] font-semibold text-ink">OCR Text & Bounding Box Localizer</div>
          <div className="text-[11px] text-ink-tertiary mt-0.5">Preserves coordinates, confidences, and reading order for fact extraction</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowBBoxes(!showBBoxes)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${showBBoxes ? 'bg-ink text-white border-ink' : 'bg-surface border-border text-ink-secondary'}`}>{showBBoxes ? 'Hide Boxes' : 'Show Boxes'}</button>
          <button onClick={() => setShowOrderBadges(!showOrderBadges)} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${showOrderBadges ? 'bg-surface border-border-strong text-ink' : 'bg-surface border-border text-ink-secondary'}`}># Order</button>
          <div className="flex rounded-lg overflow-hidden border border-border-subtle bg-surface-subtle p-0.5">
            <button onClick={() => setActiveTab('tokens')} className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${activeTab === 'tokens' ? 'bg-surface border border-border shadow-soft text-ink' : 'text-ink-tertiary'}`}>Tokens ({ocrResult.tokens.length})</button>
            <button onClick={() => setActiveTab('fulltext')} className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${activeTab === 'fulltext' ? 'bg-surface border border-border shadow-soft text-ink' : 'text-ink-tertiary'}`}>Raw Text</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 space-y-2">
          <div className="relative rounded-xl overflow-hidden bg-canvas border border-border-subtle flex items-center justify-center min-h-[420px]">
            <img src={imageUrl} alt="Package" className="w-full h-auto max-h-[600px] object-contain block" />
            {showBBoxes && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" preserveAspectRatio="none">
                {ocrResult.tokens.map((token, index) => {
                  const [x1, y1, x2, y2] = token.bbox;
                  const isHovered = hoveredTokenIndex === index;
                  const isSelected = selectedTokenIndex === index;
                  const rectX = x1 * 1000;
                  const rectY = y1 * 1000;
                  const rectW = Math.max(15, (x2 - x1) * 1000);
                  const rectH = Math.max(15, (y2 - y1) * 1000);
                  const stroke = isSelected ? '#171A1F' : isHovered ? '#0F766E' : '#D6D0C8';
                  const fill = isSelected ? 'rgba(23,26,31,0.12)' : isHovered ? 'rgba(15,118,110,0.12)' : 'rgba(23,26,31,0.04)';
                  return (
                    <g key={index} className="cursor-pointer">
                      <rect x={rectX} y={rectY} width={rectW} height={rectH} fill={fill} stroke={stroke} strokeWidth={isSelected || isHovered ? 3 : 1.5} rx="3"
                        onMouseEnter={() => setHoveredTokenIndex(index)} onMouseLeave={() => setHoveredTokenIndex(null)} onClick={() => setSelectedTokenIndex(index)} />
                      {showOrderBadges && (
                        <g>
                          <rect x={rectX} y={Math.max(0, rectY - 18)} width={22} height={16} fill="#FFFFFF" stroke={stroke} strokeWidth="1" rx="3" />
                          <text x={rectX + 11} y={Math.max(0, rectY - 18) + 11} fill="#171A1F" fontSize="10" fontWeight="600" textAnchor="middle" fontFamily="monospace">{token.line_number ?? index + 1}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <div className="flex justify-between text-[11px] text-ink-tertiary px-1">
            <span>{ocrResult.image_width}×{ocrResult.image_height} px</span>
            <span>Avg confidence <strong className="text-ink font-mono">{(ocrResult.average_confidence * 100).toFixed(1)}%</strong></span>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col h-[600px] bg-surface-subtle border border-border-subtle rounded-xl p-3">
          {activeTab === 'tokens' ? (
            <div className="flex flex-col h-full gap-3">
              <input type="text" placeholder="Filter tokens (e.g. MRP, Net Qty)…" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-[12px] focus:outline-none focus:border-ink" />
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredTokens.map((token, index) => {
                  const isHovered = hoveredTokenIndex === index;
                  const isSelected = selectedTokenIndex === index;
                  return (
                    <div key={index} onMouseEnter={() => setHoveredTokenIndex(index)} onMouseLeave={() => setHoveredTokenIndex(null)} onClick={() => setSelectedTokenIndex(index)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-surface border-ink shadow-soft' : isHovered ? 'bg-surface border-accent' : 'bg-surface border-border-subtle hover:border-border'}`}>
                      <div className="flex justify-between text-[10px] mb-1"><span className="font-mono font-medium text-ink-tertiary">#{token.line_number ?? index + 1}</span><span className="font-mono text-ink-secondary">{(token.confidence * 100).toFixed(1)}%</span></div>
                      <div className="text-[12px] text-ink break-words">{token.text}</div>
                      <div className="mt-1 text-[10px] font-mono text-ink-tertiary">[{token.bbox.map((v) => v.toFixed(2)).join(', ')}]</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full gap-2">
              <div className="text-[11px] font-medium text-ink-tertiary uppercase tracking-wide">Full Extracted Transcript</div>
              <textarea readOnly value={ocrResult.full_text} className="flex-1 w-full bg-surface border border-border rounded-xl p-3 text-[12px] font-mono text-ink focus:outline-none resize-none leading-relaxed" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
