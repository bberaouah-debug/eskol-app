import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import bwipjs from 'bwip-js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface LabelItem {
  id: number;
  nombre: string;
  codigo_barras: string;
}

export default function PrintLabels() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(['inventario', 'common']);
  const [items, setItems] = useState<LabelItem[]>(state?.selectedItems || []);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!items || items.length === 0) {
      navigate('/inventario');
      return;
    }
    // Generar códigos de barras con bwip-js después del render
    items.forEach(item => {
      try {
        bwipjs.toCanvas(`canvas-${item.id}`, {
          bcid: 'code128',       // Barcode type
          text: item.codigo_barras,    // Text to encode
          scale: 3,              // 3x scaling factor
          height: 10,            // Bar height, in millimeters
          includetext: false,    // Show human-readable text
          textxalign: 'center',  // Always good to set
        });
      } catch (e) {
        console.error('Barcode error:', e);
      }
    });
  }, [items, navigate]);

  const downloadPDF = async () => {
    if (!printRef.current) return;
    const canvas = await html2canvas(printRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('etiquetas-eskol.pdf');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-page-container">
      <div className="print-actions no-print">
        <button onClick={() => navigate(-1)} className="secondary-btn">← {t('common:back')}</button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={downloadPDF} className="primary-btn">📥 Descarregar PDF</button>
          <button onClick={handlePrint} className="primary-btn active">🖨️ Imprimir Etiquetas</button>
        </div>
      </div>

      <div className="a4-sheet-container" ref={printRef}>
        <div className="label-grid">
          {items.map((item) => (
            <div key={item.id} className="label-item">
              <div className="label-content">
                <div className="label-header">{item.nombre}</div>
                <div className="label-barcode">
                  <canvas id={`canvas-${item.id}`}></canvas>
                </div>
                <div className="label-text">{item.codigo_barras}</div>
                <div className="label-footer">ESKOL</div>
              </div>
            </div>
          ))}
          {/* Celdas vacías para rellenar la rejilla si es necesario */}
          {Array.from({ length: Math.max(0, 24 - items.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="label-item empty"></div>
          ))}
        </div>
      </div>

      <style>{`
        .print-page-container {
          padding: 2rem;
          background: #333;
          min-height: 100vh;
        }
        .print-actions {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2rem;
          max-width: 210mm;
          margin-left: auto;
          margin-right: auto;
        }
        .a4-sheet-container {
          width: 210mm;
          min-height: 297mm;
          background: white;
          margin: 0 auto;
          padding: 8mm; /* Margen de seguridad A4 */
          box-shadow: 0 0 20px rgba(0,0,0,0.5);
        }
        .label-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-auto-rows: 35.5mm; /* 297 / 8 = ~37mm, ajustamos */
          gap: 0;
          border: 1px solid #eee;
        }
        .label-item {
          border: 0.1px dashed #ccc;
          padding: 4mm;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: white;
          color: black;
        }
        .label-content {
          text-align: center;
          width: 100%;
        }
        .label-header {
          font-weight: 800;
          font-size: 10pt;
          margin-bottom: 2mm;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .label-barcode canvas {
          max-width: 100%;
          height: auto;
        }
        .label-text {
          font-family: monospace;
          font-size: 9pt;
          margin-top: 1mm;
          letter-spacing: 1.5px;
        }
        .label-footer {
          font-size: 7pt;
          color: #666;
          margin-top: 2mm;
          letter-spacing: 2px;
          border-top: 0.5px solid #eee;
          padding-top: 1mm;
        }
        
        @media print {
          body * { visibility: hidden; }
          .a4-sheet-container, .a4-sheet-container * {
            visibility: visible;
          }
          .a4-sheet-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            padding: 0;
            margin: 0;
            box-shadow: none;
          }
          .no-print { display: none !important; }
          .label-item { border: none; }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
