import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, CheckCircle, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Initiate Package Compliance Inspection</h1>
        <p className="text-sm text-slate-300 mt-1">
          Upload front, back, or Principal Display Panel (PDP) photograph of the packaged commodity for Legal Metrology analysis.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload & Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Drag & Drop Zone */}
        <div className="md:col-span-2 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-gold-500/60 rounded-2xl p-8 text-center cursor-pointer bg-gov-850/60 hover:bg-gov-800/60 transition-all flex flex-col items-center justify-center min-h-[300px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Package Preview"
                  className="max-h-60 rounded-lg mx-auto shadow-md border border-slate-700 object-contain"
                />
                <div className="flex items-center justify-center space-x-2 text-xs text-gold-400">
                  <FileImage className="w-4 h-4" />
                  <span>{selectedFile?.name} ({(selectedFile!.size / 1024).toFixed(1)} KB)</span>
                </div>
                <p className="text-xs text-slate-400">Click or drag a new image to replace</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-full bg-gov-800 border border-gold-500/30 flex items-center justify-center mx-auto text-gold-400">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-white">Upload Package Photograph</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Drag and drop your image here, or click to browse files from your computer or field tablet.
                </p>
                <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500">
                  <span>JPEG, PNG, WebP</span>
                  <span>•</span>
                  <span>Max 25 MB</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Category & Action */}
        <div className="glass-panel rounded-2xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white border-b border-slate-700/60 pb-2">
              Inspection Parameters
            </h2>

            <div>
              <label htmlFor="commodity-select" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Commodity Category
              </label>
              <select
                id="commodity-select"
                value={commodityType}
                onChange={(e) => setCommodityType(e.target.value)}
                className="w-full bg-gov-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-gold-500 transition-all"
              >
                <option value="FOOD_GRAINS">Food Grains (Rice, Atta, Pulses)</option>
                <option value="EDIBLE_OILS">Edible Oils & Vanaspati</option>
                <option value="BISCUITS_CONFECTIONERY">Biscuits & Confectionery</option>
                <option value="TEA_COFFEE">Tea & Coffee</option>
                <option value="SOAP_DETERGENT">Soaps & Detergents</option>
                <option value="BEVERAGES">Packaged Drinking Water & Beverages</option>
                <option value="GENERAL_PACKAGED_GOODS">General Consumer Commodities</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Used to determine Second Schedule standard sizes and Unit Sale Price requirements.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-gov-900/80 border border-slate-700/70 text-xs space-y-1.5 text-slate-300">
              <span className="font-semibold text-gold-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Automated Pipeline</span>
              </span>
              <p className="text-[11px] text-slate-400">
                1. OpenCV Preprocessing &amp; Blur Assessment<br/>
                2. OCR Text &amp; Bounding Box Extraction<br/>
                3. Mandatory Declaration Parsing<br/>
                4. PCR 2011 Rule Verification
              </p>
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className={`w-full py-3 rounded-lg font-bold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all ${
              !selectedFile || uploading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 hover:shadow-gold-500/20 cursor-pointer'
            }`}
          >
            {uploading ? (
              <span>Processing Perception Pipeline...</span>
            ) : (
              <>
                <span>Start Compliance Scan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Upload Confirmation & Quality Feedback */}
      {uploadResult && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Scan Registered Successfully</h3>
                <p className="text-xs text-slate-400 font-mono">Scan ID: {uploadResult.scan_number}</p>
              </div>
            </div>
            <button
              onClick={() => onScanCreated(uploadResult.scan_id)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5"
            >
              <span>Inspect Findings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-700/60 text-xs">
            <div className="p-3 bg-gov-900 rounded-lg">
              <span className="text-slate-400 block">Resolution</span>
              <span className="font-mono text-slate-200 font-semibold">
                {uploadResult.quality_assessment?.width} × {uploadResult.quality_assessment?.height} px
              </span>
            </div>
            <div className="p-3 bg-gov-900 rounded-lg">
              <span className="text-slate-400 block">Blur Metric (Laplacian)</span>
              <span className={`font-mono font-semibold ${uploadResult.quality_assessment?.is_blurry ? 'text-amber-400' : 'text-emerald-400'}`}>
                {uploadResult.quality_assessment?.laplacian_variance} ({uploadResult.quality_assessment?.is_blurry ? 'Blurry' : 'Crisp'})
              </span>
            </div>
            <div className="p-3 bg-gov-900 rounded-lg">
              <span className="text-slate-400 block">Contrast Metric</span>
              <span className="font-mono text-slate-200 font-semibold">
                {uploadResult.quality_assessment?.contrast_score}
              </span>
            </div>
            <div className="p-3 bg-gov-900 rounded-lg">
              <span className="text-slate-400 block">Integrity (SHA-256)</span>
              <span className="font-mono text-gold-300 font-semibold truncate block" title={uploadResult.sha256_hash}>
                {uploadResult.sha256_hash?.slice(0, 10)}...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
