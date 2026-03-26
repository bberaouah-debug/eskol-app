import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

interface Props {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();

    reader.decodeFromVideoDevice(
      undefined,       // undefined = dispositivo por defecto (trasero en móvil)
      videoRef.current!,
      (result, err) => {
        if (result) {
          const code = result.getText();
          setScanning(false);
          // Detener la cámara y notificar
          controlsRef.current?.stop();
          onScan(code);
        }
        // err es normal si aún no ha escaneado nada — ignorar
      }
    )
      .then((controls) => {
        controlsRef.current = controls;
      })
      .catch(() => {
        setError('No se puede acceder a la cámara. Comprueba los permisos.');
      });

    return () => {
      controlsRef.current?.stop();
    };
  }, []);

  return (
    <div className="modal-overlay">
      <div className="camera-modal">
        <div className="modal-header">
          <h2>🔎 Escanear Código de Barras</h2>
          <button className="close-modal" onClick={onClose}>&times;</button>
        </div>

        <div className="camera-body">
          {error ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</p>
              <p>{error}</p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <video
                ref={videoRef}
                style={{ width: '100%', borderRadius: '8px', display: 'block' }}
              />
              {/* Recuadro de escaneo */}
              <div className="scan-overlay">
                <div className="scan-frame" />
                {scanning && <p className="scan-hint">Apunta al código de barras</p>}
              </div>
            </div>
          )}

          <div className="camera-actions">
            <button className="lang-btn" onClick={onClose}>❌ Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
