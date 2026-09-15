import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { CameraCapture } from '../components/CameraCapture';

interface NewScanViewProps {
  onScanCreated: (scanId: string) => void;
}

export const NewScanView: React.FC<NewScanViewProps> = ({ onScanCreated }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [commodityType, setCommodityType] = useState('FOOD_GRAINS');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCameraCapture = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setUploadResult(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowCamera(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select or capture a packaged commodity image first.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await api.uploadScan(selectedFile, commodityType);
      setUploadResult(result);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please check network or file format.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-[1120px] mx-auto space-y-5">
      {showCamera && <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-ink">Initiate Package Compliance Inspection</h1>
          <p className="text-[12px] text-ink-secondary mt-1 max-w-2xl leading-relaxed">
            Upload front, back, or Principal Display Panel (PDP) photograph. System validates image quality, extracts declarations, and verifies PCR 2011 rules.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-ink-tertiary">
          <span className="px-2 py-1 rounded-full bg-surface border border-border">JPEG • PNG • WebP • 25MB max</span>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-danger-bg border border-danger-border flex items-start gap-2.5 text-[12px] text-danger">
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left – upload */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-surface border border-border rounded-xl shadow-soft p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] font-semibold tracking-wide uppercase text-ink-tertiary">Image Source</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCamera(true)}
                  className="px-3 py-1.5 rounded-lg bg-ink text-white text-[12px] font-medium hover:bg-black border border-ink"
                >
                  Capture from Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-border text-[12px] font-medium hover:border-border-strong"
                >
                  Upload File
                </button>
              </div>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border border-dashed border-border-strong hover:border-ink/30 rounded-xl p-6 text-center bg-surface-subtle hover:bg-canvas transition-colors min-h-[320px] flex flex-col items-center justify-center"
            >
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="hidden" />

              {previewUrl ? (
                <div className="space-y-3 w-full">
                  <div className="relative mx-auto max-w-[420px] rounded-xl overflow-hidden border border-border bg-white shadow-soft">
                    <img src={previewUrl} alt="Preview" className="max-h-[320px] w-full object-contain" />
                  </div>
                  <div className="flex items-center justify-center gap-2 text-[11px] text-ink-secondary">
                    <span className="px-2 py-0.5 rounded-full bg-surface border border-border font-mono">{selectedFile?.name}</span>
                    <span>{selectedFile && (selectedFile.size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="text-[11px] text-ink-tertiary">Click or drag to replace image</div>
                </div>
              ) : (
                <div className="space-y-3 max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center mx-auto text-ink-tertiary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  </div>
                  <div className="text-[13px] font-medium text-ink">Drop package image here</div>
                  <div className="text-[11px] text-ink-secondary leading-relaxed">Drag & drop or use camera. Ensure Principal Display Panel is clearly visible with good lighting.</div>
                </div>
              )}
            </div>

            {/* Workflow steps */}
            <div className="mt-4 grid grid-cols-5 gap-2 text-[10px]">
              {[
                { n: 1, label: 'Upload', active: true },
                { n: 2, label: 'Analyze', active: !!uploadResult },
                { n: 3, label: 'Extract', active: false },
                { n: 4, label: 'Verify', active: false },
                { n: 5, label: 'Result', active: false },
              ].map((s) => (
                <div key={s.n} className={`flex items-center gap-2 p-2 rounded-lg border ${s.active ? 'bg-ink text-white border-ink' : 'bg-surface-subtle border-border-subtle text-ink-tertiary'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium border ${s.active ? 'bg-white/15 border-white/20 text-white' : 'bg-surface border-border text-ink-tertiary'}`}>{s.n}</span>
                  <span className="font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upload result */}
          {uploadResult && (
            <div className="bg-surface border border-emerald-200 rounded-xl p-4 shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-success-bg border border-success-border flex items-center justify-center text-success">✓</div>
                  <div>
                    <div className="text-[13px] font-semibold text-ink">Scan Registered Successfully</div>
                    <div className="text-[11px] font-mono text-ink-secondary mt-0.5">ID: {uploadResult.scan_number} • SHA-256: {uploadResult.sha256_hash?.slice(0, 12)}…</div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-surface-subtle border border-border-subtle"><div className="text-ink-tertiary">Resolution</div><div className="font-mono font-medium text-ink">{uploadResult.quality_assessment?.width}×{uploadResult.quality_assessment?.height}</div></div>
                      <div className="p-2 rounded-lg bg-surface-subtle border border-border-subtle"><div className="text-ink-tertiary">Blur (Laplacian)</div><div className={`font-mono font-medium ${uploadResult.quality_assessment?.is_blurry ? 'text-warning' : 'text-success'}`}>{uploadResult.quality_assessment?.laplacian_variance} {uploadResult.quality_assessment?.is_blurry ? '• Blurry' : '• Crisp'}</div></div>
                      <div className="p-2 rounded-lg bg-surface-subtle border border-border-subtle"><div className="text-ink-tertiary">Contrast</div><div className="font-mono font-medium text-ink">{uploadResult.quality_assessment?.contrast_score}</div></div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onScanCreated(uploadResult.scan_id)}
                  className="shrink-0 px-4 py-2 bg-ink text-white text-[12px] font-medium rounded-lg hover:bg-black"
                >
                  Inspect Findings →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right – params */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface border border-border rounded-xl shadow-soft p-5">
            <div className="text-[11px] font-semibold tracking-widest uppercase text-ink-tertiary mb-3">Inspection Parameters</div>

            <label className="block text-[11px] font-medium text-ink-secondary mb-1.5">Commodity Category</label>
            <select
              value={commodityType}
              onChange={(e) => setCommodityType(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-[13px] text-ink focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink/10"
            >
              <option value="FOOD_GRAINS">Food Grains (Rice, Atta, Pulses)</option>
              <option value="EDIBLE_OILS">Edible Oils & Vanaspati</option>
              <option value="BISCUITS_CONFECTIONERY">Biscuits & Confectionery</option>
              <option value="TEA_COFFEE">Tea & Coffee</option>
              <option value="SOAP_DETERGENT">Soaps & Detergents</option>
              <option value="BEVERAGES">Packaged Water & Beverages</option>
              <option value="GENERAL_PACKAGED_GOODS">General Consumer Commodities</option>
            </select>
            <div className="text-[11px] text-ink-tertiary mt-2 leading-relaxed">Determines Second Schedule standard sizes and USP requirements.</div>

            <div className="mt-5 p-3 rounded-xl bg-surface-subtle border border-border-subtle">
              <div className="text-[11px] font-semibold text-ink flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-accent" /> Automated Pipeline</div>
              <div className="mt-2 space-y-1.5 text-[11px] text-ink-secondary leading-relaxed">
                <div className="flex gap-2"><span className="text-ink-tertiary">1.</span><span>OpenCV preprocessing & blur assessment</span></div>
                <div className="flex gap-2"><span className="text-ink-tertiary">2.</span><span>OCR text & bounding box extraction</span></div>
                <div className="flex gap-2"><span className="text-ink-tertiary">3.</span><span>Mandatory declaration parsing</span></div>
                <div className="flex gap-2"><span className="text-ink-tertiary">4.</span><span>PCR 2011 rule verification</span></div>
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className={`w-full mt-5 py-2.5 rounded-lg text-[13px] font-medium border transition-all ${!selectedFile || uploading ? 'bg-surface-subtle text-ink-tertiary border-border-subtle cursor-not-allowed' : 'bg-ink text-white border-ink hover:bg-black shadow-soft'}`}
            >
              {uploading ? 'Processing image...' : 'Start Compliance Scan'}
            </button>
            <div className="mt-2 text-[10px] text-center text-ink-tertiary">AI extracts • Rules decide • Evidence-backed</div>
          </div>

          <div className="bg-canvas border border-border-subtle rounded-xl p-4">
            <div className="text-[11px] font-semibold text-ink">Evidence & Transparency</div>
            <div className="text-[11px] text-ink-secondary mt-1 leading-relaxed">Every finding includes bounding box, confidence, and statutory citation. No black-box decisions.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
