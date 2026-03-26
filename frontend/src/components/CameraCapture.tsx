import { useRef, useState, useCallback } from 'react';

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

type Phase = 'streaming' | 'preview' | 'error';

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>('streaming');
  const [capturedUrl, setCapturedUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  // Inicia la cámara al montar el vídeo
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // cámara trasera en móvil
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setErrorMsg('No se puede acceder a la cámara. Comprueba los permisos del navegador.');
      setPhase('error');
    }
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const url = canvas.toDataURL('image/png');
    setCapturedUrl(url);
    stopCamera();
    setPhase('preview');
  };

  const handleAccept = () => {
    const canvas = canvasRef.current!;
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `foto_${Date.now()}.png`, { type: 'image/png' });
        onCapture(file);
      }
      onClose();
    }, 'image/png');
  };

  const handleRepeat = async () => {
    setCapturedUrl('');
    setPhase('streaming');
    await startCamera();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="camera-modal">
        <div className="modal-header">
          <h2>📷 Capturar Foto</h2>
          <button className="close-modal" onClick={handleClose}>&times;</button>
        </div>

        <div className="camera-body">
          {phase === 'error' && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</p>
              <p>{errorMsg}</p>
            </div>
          )}

          {phase === 'streaming' && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                onCanPlay={async () => { if (!streamRef.current) await startCamera(); }}
                style={{ width: '100%', borderRadius: '8px', display: 'block' }}
              />
              <div className="camera-actions">
                <button className="primary-btn" onClick={handleCapture}>
                  📸 Hacer Foto
                </button>
              </div>
            </>
          )}

          {phase === 'preview' && (
            <>
              <img
                src={capturedUrl}
                alt="Vista previa"
                style={{ width: '100%', borderRadius: '8px', display: 'block' }}
              />
              <div className="camera-actions">
                <button className="lang-btn" onClick={handleRepeat}>🔄 Repetir</button>
                <button className="primary-btn" onClick={handleAccept}>✅ Aceptar</button>
              </div>
            </>
          )}
        </div>

        {/* Canvas oculto para capturar el frame */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

// Inicializamos la cámara en cuanto el componente se monta
CameraCapture.displayName = 'CameraCapture';
