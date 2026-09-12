// ==============================================================================
// JUBILANT METAL AND ALLOYS - DOCUMENT & PDF GENERATION ENGINE
// ==============================================================================

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFExportOptions {
  filename?: string;
  elementId: string;
  onProgress?: (progress: number) => void;
  saveFile?: boolean;
}

export interface PDFExportResult {
  success: boolean;
  blob?: Blob;
  file?: File;
  filename: string;
  error?: string;
}

export function triggerFileDownload(blobOrFile: Blob | File, filename: string) {
  const url = URL.createObjectURL(blobOrFile);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}

export async function createQuotationPDF({
  elementId,
  filename = 'Jubilant-Quotation.pdf',
  onProgress,
  saveFile = true,
}: PDFExportOptions): Promise<PDFExportResult> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id #${elementId} not found`);
    return { success: false, filename, error: `Element with id #${elementId} not found` };
  }

  try {
    if (onProgress) onProgress(15);

    // Ensure all images (logo, stamp, signature) inside the quotation element are fully loaded
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          setTimeout(resolve, 600); // Safety fallback
        });
      })
    );

    // Small delay to ensure all DOM layout and child assets are painted
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Check if the document contains discrete .a4-page elements
    const pageElements = Array.from(element.querySelectorAll<HTMLElement>('.a4-page'));

    if (pageElements.length > 0) {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      for (let i = 0; i < pageElements.length; i++) {
        const pageEl = pageElements[i];
        if (onProgress) {
          onProgress(20 + Math.floor((68 * (i + 1)) / pageElements.length));
        }

        // Ensure page element renders at precise A4 proportions
        const prevWidth = pageEl.style.width;
        const prevMinHeight = pageEl.style.minHeight;
        pageEl.style.width = '794px';
        pageEl.style.minHeight = '1123px';

        const canvas = await html2canvas(pageEl, {
          scale: 2, // 2x for sharp retina rendering
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794,
        });

        pageEl.style.width = prevWidth;
        pageEl.style.minHeight = prevMinHeight;

        const imgData = canvas.toDataURL('image/png', 1.0);
        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
      }

      if (onProgress) onProgress(92);

      const blob = pdf.output('blob');
      const file = new File([blob], filename, {
        type: 'application/pdf',
        lastModified: Date.now(),
      });

      if (saveFile) {
        pdf.save(filename);
      }

      if (onProgress) onProgress(100);
      return { success: true, blob, file, filename };
    }

    // Fallback if no .a4-page found (single continuous container)
    const prevWidth = element.style.width;
    element.style.width = '794px';

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    element.style.width = prevWidth;

    if (onProgress) onProgress(60);

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    if (onProgress) onProgress(92);

    const blob = pdf.output('blob');
    const file = new File([blob], filename, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });

    if (saveFile) {
      pdf.save(filename);
    }

    if (onProgress) onProgress(100);
    return { success: true, blob, file, filename };
  } catch (err: any) {
    console.error('Failed to generate PDF:', err);
    return { success: false, filename, error: err?.message || 'Unknown error' };
  }
}

export async function generateQuotationPDF(options: PDFExportOptions): Promise<boolean> {
  const res = await createQuotationPDF({ ...options, saveFile: options.saveFile !== false });
  return res.success;
}

export const createProformaPDF = createQuotationPDF;
export const generateProformaPDF = generateQuotationPDF;

export function triggerPrint() {
  window.print();
}

