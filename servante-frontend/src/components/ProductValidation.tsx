import React, { useRef, useState } from 'react';
import { Camera, Check, X, AlertCircle, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ProductValidationProps {
  toolName: string;
  borrowId: string;
  onValidationSuccess: () => void;
  onValidationFailure: (reason: string) => void;
  onSkip?: () => void;
}

const ProductValidation: React.FC<ProductValidationProps> = ({
  toolName,
  borrowId,
  onValidationSuccess,
  onValidationFailure,
  onSkip
}) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize camera
  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        const imageData = canvasRef.current.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  // Upload image for validation
  const validateImage = async (imageFile: Blob | File) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch(`/api/borrows/${borrowId}/validate-product`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      setValidationResult(result);

      if (result.success && result.is_valid) {
        setTimeout(() => {
          onValidationSuccess();
        }, 2000);
      } else {
        onValidationFailure(result.message || 'Product validation failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation error';
      setError(errorMessage);
      console.error('Validation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle captured image
  const handleValidateCapture = async () => {
    if (canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          validateImage(blob);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateImage(file);
    }
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setValidationResult(null);
    setError(null);
    startCamera();
  };

  if (validationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border-2 border-green-200">
            {validationResult.success && validationResult.is_valid ? (
              <>
                <div className="flex justify-center mb-8">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                    <Check className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-center text-green-600 mb-4">
                  {t('productValidationSuccess') || 'Product Validated!'}
                </h2>
                <p className="text-xl text-center text-slate-600 mb-4">
                  {validationResult.message}
                </p>
                <div className="bg-green-50 rounded-xl p-6 mb-6 border-2 border-green-200">
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Expected:</strong> {validationResult.validation.expectedProduct}
                  </p>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Detected:</strong> {validationResult.validation.detectedProduct}
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>Confidence:</strong> {(validationResult.validation.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-8">
                  <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-center text-red-600 mb-4">
                  {t('productValidationFailed') || 'Validation Failed'}
                </h2>
                <p className="text-xl text-center text-slate-600 mb-4">
                  {validationResult.message}
                </p>
                <div className="bg-red-50 rounded-xl p-6 mb-6 border-2 border-red-200">
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Expected:</strong> {validationResult.validation?.expectedProduct}
                  </p>
                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Detected:</strong> {validationResult.validation?.detectedProduct || 'No product detected'}
                  </p>
                  {validationResult.validation?.confidence && (
                    <p className="text-sm text-slate-600">
                      <strong>Confidence:</strong> {(validationResult.validation.confidence * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
                <button
                  onClick={retakePhoto}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  {t('tryAgain') || 'Try Again'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (capturedImage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border-2 border-blue-200">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
              {t('verifyProductPhoto') || 'Verify Product Photo'}
            </h2>
            <p className="text-xl text-center text-slate-600 mb-8">
              {t('confirmPhotoIsClear', { tool: toolName }) || `Confirm the photo clearly shows the ${toolName}`}
            </p>

            <img src={capturedImage} alt="Captured product" className="w-full rounded-2xl mb-8 border-4 border-blue-200 shadow-lg" />

            <div className="flex gap-4">
              <button
                onClick={retakePhoto}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                {t('retake') || 'Retake'}
              </button>
              <button
                onClick={handleValidateCapture}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    {t('validating') || 'Validating...'}
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {t('validate') || 'Validate'}
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border-2 border-blue-200">
            <div className="flex justify-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center animate-pulse shadow-xl">
                <Camera className="w-16 h-16 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">
              {t('captureProductPhoto') || 'Capture Product Photo'}
            </h2>
            <p className="text-xl text-center text-slate-600 mb-8">
              {t('verifyProductMatches', { tool: toolName }) || `Please take a photo to verify the product matches: ${toolName}`}
            </p>

            <div className="bg-slate-900 rounded-2xl overflow-hidden mb-8 border-4 border-blue-200 shadow-lg aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                onLoadedMetadata={startCamera}
              />
            </div>

            <canvas ref={canvasRef} className="hidden" width={1280} height={720} />

            <div className="flex flex-col gap-4">
              <button
                onClick={capturePhoto}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-3 text-lg"
              >
                <Camera className="w-6 h-6" />
                {t('capturePhoto') || 'Capture Photo'}
              </button>

              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  {t('uploadPhoto') || 'Upload Photo'}
                </button>
              </div>

              {onSkip && (
                <button
                  onClick={onSkip}
                  className="w-full bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold py-3 px-6 rounded-xl transition-colors"
                >
                  {t('skip') || 'Skip'}
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductValidation;
