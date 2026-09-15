import React, { useState } from 'react';
import { OCRResult } from '../../types';
import { Eye, EyeOff, Search, Hash, ShieldCheck, Layers } from 'lucide-react';

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

  const filteredTokens = ocrResult.tokens.filter((t) =>
    t.text.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-700/80 space-y-6">
      {/* Visualizer Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/70 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Layers className="w-4 h-4 text-gold-400" />
            <span>Perception Layer: OCR Text &amp; Bounding Box Localizer</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Preserves coordinates, confidences, and reading order for Legal Metrology fact extraction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowBBoxes(!showBBoxes)}
            className={`px-3 py-1.5 rounded-lg font-medium border transition-all flex items-center space-x-1.5 ${
              showBBoxes
                ? 'bg-gov-700 text-gold-300 border-gold-500/40'
                : 'bg-gov-900 text-slate-400 border-slate-700'
            }`}
          >
            {showBBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Bounding Boxes</span>
          </button>

          <button
            onClick={() => setShowOrderBadges(!showOrderBadges)}
            className={`px-3 py-1.5 rounded-lg font-medium border transition-all flex items-center space-x-1.5 ${
              showOrderBadges
                ? 'bg-gov-700 text-sky-300 border-sky-500/40'
                : 'bg-gov-900 text-slate-400 border-slate-700'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Reading Order</span>
          </button>

          <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-gov-900 p-0.5">
            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                activeTab === 'tokens' ? 'bg-gold-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tokens ({ocrResult.tokens.length})
            </button>
            <button
              onClick={() => setActiveTab('fulltext')}
              className={`px-2.5 py-1 rounded text-xs font-semibold ${
                activeTab === 'fulltext' ? 'bg-gold-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Raw Text
            </button>
          </div>
        </div>
      </div>

      {/* Main Visualizer Content: Image Canvas (Left) + Tokens/Text (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (7 cols): Package Image with Responsive Overlay */}
        <div className="lg:col-span-7 space-y-2">
          <div className="relative rounded-xl overflow-hidden bg-gov-950 border border-slate-800 flex items-center justify-center min-h-[420px] select-none">
            {/* The Package Image */}
            <img
              src={imageUrl}
              alt="Inspected Package"
              className="w-full h-auto max-h-[600px] object-contain block"
            />

            {/* SVG Bounding Boxes Overlay */}
            {showBBoxes && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-auto"
                viewBox="0 0 1000 1000"
                preserveAspectRatio="none"
              >
                {ocrResult.tokens.map((token, index) => {
                  const [x1, y1, x2, y2] = token.bbox;
                  const isHovered = hoveredTokenIndex === index;
                  const isSelected = selectedTokenIndex === index;

                  // Convert normalized 0.0 - 1.0 to SVG 0 - 1000 coords
                  const rectX = x1 * 1000;
                  const rectY = y1 * 1000;
                  const rectW = Math.max(15, (x2 - x1) * 1000);
                  const rectH = Math.max(15, (y2 - y1) * 1000);

                  const strokeColor = isSelected
                    ? '#F59E0B' // Amber for selected
                    : isHovered
                    ? '#10B981' // Emerald for hovered
                    : 'rgba(212, 175, 55, 0.7)'; // Gold for default

                  const fillColor = isSelected
                    ? 'rgba(245, 158, 11, 0.3)'
                    : isHovered
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'rgba(212, 175, 55, 0.08)';

                  return (
                    <g key={index} className="cursor-pointer">
                      <rect
                        x={rectX}
                        y={rectY}
                        width={rectW}
                        height={rectH}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isSelected || isHovered ? '4' : '2'}
                        rx="4"
                        onMouseEnter={() => setHoveredTokenIndex(index)}
                        onMouseLeave={() => setHoveredTokenIndex(null)}
                        onClick={() => setSelectedTokenIndex(index)}
                      />

                      {showOrderBadges && (
                        <g>
                          <rect
                            x={rectX}
                            y={Math.max(0, rectY - 22)}
                            width={26}
                            height={20}
                            fill="#0B1728"
                            stroke={strokeColor}
                            strokeWidth="1.5"
                            rx="3"
                          />
                          <text
                            x={rectX + 13}
                            y={Math.max(0, rectY - 22) + 14}
                            fill="#F1C40F"
                            fontSize="12"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            {token.line_number ?? index + 1}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Dimensions: {ocrResult.image_width} × {ocrResult.image_height} px</span>
            <span>Avg OCR Confidence: <strong className="text-emerald-400">{(ocrResult.average_confidence * 100).toFixed(1)}%</strong></span>
          </div>
        </div>

        {/* Right Col (5 cols): Token Inspector / Raw Text */}
        <div className="lg:col-span-5 flex flex-col h-[600px] glass-panel-subtle rounded-xl p-4 border border-slate-700/60">
          {activeTab === 'tokens' ? (
            <div className="flex flex-col h-full space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter tokens (e.g. MRP, Net Qty)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gov-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-gold-500"
                />
              </div>

              {/* Tokens Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredTokens.map((token, index) => {
                  const isHovered = hoveredTokenIndex === index;
                  const isSelected = selectedTokenIndex === index;

                  return (
                    <div
                      key={index}
                      onMouseEnter={() => setHoveredTokenIndex(index)}
                      onMouseLeave={() => setHoveredTokenIndex(null)}
                      onClick={() => setSelectedTokenIndex(index)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gov-700/80 border-gold-400 shadow-md ring-1 ring-gold-400'
                          : isHovered
                          ? 'bg-gov-800 border-emerald-500/60'
                          : 'bg-gov-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-mono text-gold-400 font-bold">
                          #{token.line_number ?? index + 1}
                        </span>
                        <span className="flex items-center space-x-1 text-slate-400">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>{(token.confidence * 100).toFixed(1)}%</span>
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-100 break-words">{token.text}</p>
                      <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
                        bbox: [{token.bbox.map((v) => v.toFixed(2)).join(', ')}]
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Full Extracted Transcript
              </span>
              <textarea
                readOnly
                value={ocrResult.full_text}
                className="flex-1 w-full bg-gov-900 border border-slate-700/80 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none resize-none leading-relaxed"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
