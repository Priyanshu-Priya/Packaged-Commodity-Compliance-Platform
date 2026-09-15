import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCw, CheckCircle } from 'lucide-react';

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

    // Convert data URL to File object
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File(
          [blob],
          `package-scan-${Date.now()}.jpg`,
          { type: 'image/jpeg' }
        );
        onCapture(file);
        onClose();
      });
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-gov-900 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <Camera className="w-6 h-6 text-gold-400" />
            <h2 className="text-lg font-bold text-white">Capture Package Image</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View / Preview */}
        <div className="relative bg-black aspect-video flex items-center justify-center">
          {error ? (
            <div className="text-center p-8 space-y-3">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-rose-400" />
              </div>
              <p className="text-rose-300 text-sm">{error}</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-slate-950 rounded-lg text-sm font-semibold transition-all"
              >
                Retry Camera Access
              </button>
            </div>
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured package"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Overlay Guidelines */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-gold-400/40 rounded-xl"></div>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gold-400/30"></div>
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gold-400/30"></div>
              </div>
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-white text-sm font-semibold bg-black/60 inline-block px-4 py-2 rounded-full">
                  Align package within the frame
                </p>
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Controls */}
        <div className="p-4 flex items-center justify-center space-x-4">
          {capturedImage ? (
            <>
              <button
                onClick={retakePhoto}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center space-x-2 transition-all"
              >
                <RotateCw className="w-4 h-4" />
                <span>Retake</span>
              </button>
              <button
                onClick={confirmCapture}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-lg font-semibold flex items-center space-x-2 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={switchCamera}
                className="w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center text-white transition-all"
                title="Switch camera"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                onClick={capturePhoto}
                disabled={!stream}
                className="w-16 h-16 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 disabled:from-slate-700 disabled:to-slate-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-gold-500/30 transition-all disabled:cursor-not-allowed"
              >
                <div className="w-14 h-14 rounded-full border-4 border-white"></div>
              </button>
              <div className="w-12"></div> {/* Spacer for symmetry */}
            </>
          )}
        </div>

        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-slate-400">
            Ensure good lighting and the Principal Display Panel is clearly visible
          </p>
        </div>
      </div>
    </div>
  );
};
