import React, { useState, useRef, useEffect } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageData);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmCapture = () => {
    if (!capturedImage) return;
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `package-scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        onClose();
      });
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-[720px] w-full bg-surface rounded-2xl overflow-hidden shadow-soft-lg border border-border">
        <div className="flex items-center justify-between px-5 h-[56px] border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-ink text-white flex items-center justify-center">◍</div>
            <h2 className="text-[13px] font-semibold text-ink">Capture Package Image</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-border bg-surface hover:bg-surface-hover flex items-center justify-center text-ink-secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="relative bg-[#111418] aspect-[16/10] flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-danger-bg border border-danger-border flex items-center justify-center mx-auto text-danger">!</div>
              <p className="text-danger text-[12px]">{error}</p>
              <button onClick={startCamera} className="px-3 py-1.5 bg-surface border border-border rounded-lg text-[12px] font-medium">Retry Camera Access</button>
            </div>
          ) : capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-6 border border-white/20 rounded-xl"></div>
                <div className="absolute top-1/2 left-6 right-6 h-px bg-white/10"></div>
                <div className="absolute left-1/2 top-6 bottom-6 w-px bg-white/10"></div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-white text-[11px] font-medium bg-black/60 px-3 py-1 rounded-full border border-white/10">Align package within the frame</span>
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 flex items-center justify-center gap-3 border-t border-border-subtle bg-surface-subtle/50">
          {capturedImage ? (
            <>
              <button onClick={retakePhoto} className="px-4 py-2 bg-surface border border-border rounded-lg text-[12px] font-medium hover:border-border-strong">Retake</button>
              <button onClick={confirmCapture} className="px-5 py-2 bg-ink text-white rounded-lg text-[12px] font-medium hover:bg-black">Use This Photo</button>
            </>
          ) : (
            <>
              <button onClick={switchCamera} className="w-10 h-10 bg-surface border border-border rounded-full flex items-center justify-center hover:border-border-strong" title="Switch camera">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
              </button>
              <button onClick={capturePhoto} disabled={!stream} className="w-14 h-14 bg-ink hover:bg-black disabled:bg-surface-subtle disabled:border disabled:border-border rounded-full flex items-center justify-center shadow-soft">
                <div className="w-10 h-10 rounded-full border-2 border-white"></div>
              </button>
              <div className="w-10" />
            </>
          )}
        </div>
        <div className="px-4 pb-3 text-center text-[11px] text-ink-tertiary">Ensure good lighting and Principal Display Panel is clearly visible</div>
      </div>
    </div>
  );
};
