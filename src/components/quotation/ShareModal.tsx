import React, { useState } from 'react';
import { Quotation, ProformaInvoice } from '../../types';
import { formatINR } from '../../utils/calculator';
import { useToast } from '../../context/ToastContext';
import { storage } from '../../services/storage';
import {
  Share2,
  Copy,
  Check,
  MessageSquare,
  Mail,
  X,
  Download,
  FileText,
  CheckCircle2,
  Loader2,
  Paperclip,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';
import { createQuotationPDF, createProformaPDF, triggerFileDownload } from '../../utils/pdfGenerator';
import { QuotationDocument } from './QuotationDocument';
import { ProformaDocument } from '../proforma/ProformaDocument';

export interface ShareModalProps {
  quotation?: Quotation;
  proforma?: ProformaInvoice;
  isOpen: boolean;
  onClose: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const ShareModal: React.FC<ShareModalProps> = ({ quotation, proforma, isOpen, onClose }) => {
  const { success, error } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [isGeneratingWhatsApp, setIsGeneratingWhatsApp] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [fallbackNotice, setFallbackNotice] = useState<{
    show: boolean;
    filename: string;
    filePath?: string;
  } | null>(null);

  const doc = proforma || quotation;
  if (!isOpen || !doc) return null;

  const isProforma = Boolean(proforma);
  const docNumber = isProforma ? (proforma!.proformaNumber || 'Proforma') : (quotation!.quotationNumber || 'Quotation');
  const docTitle = isProforma ? 'Proforma Invoice' : 'Quotation';
  const docUrl = window.location.origin + (isProforma ? `/proformas/${proforma!.id}` : `/quotations/${quotation!.id}`);
  const customerName = doc.customerName || 'Customer';
  const contactPerson = doc.customerContactPerson || customerName;
  const grandTotal = doc.grandTotal || 0;
  const validUntil = doc.validUntil || '';

  const messageText = `Dear ${contactPerson},

Please find attached our ${docTitle} ${docNumber} from Jubilant Metal and Alloys.

${isProforma ? 'Proforma' : 'Quotation'} Value: ${formatINR(grandTotal)}
Valid Until: ${validUntil}

Link to view & download ${docTitle}:
${docUrl}

Regards,
JUBILANT METAL AND ALLOYS
sales@jubilantmetal.com
+91 22 2741 8900`;

  // Target phone formatting
  const targetPhone =
    doc.customerPhone ||
    storage.getCustomerById(doc.customerId)?.whatsapp ||
    storage.getCustomerById(doc.customerId)?.phone;
  let cleanPhone = targetPhone?.replace(/[^0-9]/g, '') || '';
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(docUrl);
    setCopiedLink(true);
    success('Link Copied', `${docTitle} link copied to clipboard`);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    setCopiedText(true);
    success('Text Copied', 'Message template copied to clipboard');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleWhatsApp = async () => {
    setIsGeneratingWhatsApp(true);
    setPdfProgress(15);
    setFallbackNotice(null);

    const filename = `${docNumber}-Jubilant.pdf`;
    const docElementId = isProforma
      ? `share-modal-print-pi-${proforma!.id}`
      : `share-modal-print-doc-${quotation!.id}`;

    try {
      // 1. Generate the exact document PDF
      const pdfGen = isProforma ? createProformaPDF : createQuotationPDF;
      const result = await pdfGen({
        elementId: docElementId,
        filename,
        saveFile: false,
        onProgress: (p) => setPdfProgress(p),
      });

      if (!result.success || !result.blob || !result.file) {
        throw new Error(result.error || `Could not generate ${docTitle} PDF`);
      }

      // In Electron desktop environment: save silently to temp, copy to clipboard, open WhatsApp with NO Save As / download dialog
      if (window.electronAPI?.prepareWhatsAppShare) {
        const b64 = await blobToBase64(result.blob);
        const shareRes = await window.electronAPI.prepareWhatsAppShare(
          b64,
          filename,
          messageText,
          targetPhone
        );

        if (!shareRes.success) {
          throw new Error(shareRes.error || 'Failed to prepare WhatsApp share');
        }

        setFallbackNotice({
          show: true,
          filename,
          filePath: shareRes.filePath,
        });

        success(
          'WhatsApp Opened & PDF Attached',
          `${docTitle} PDF (${filename}) is ready! Press Ctrl+V in WhatsApp to send.`
        );
        return;
      }

      // 2. Web Share API fallback (for supported browsers / mobile)
      let sharedViaNative = false;
      if (
        typeof navigator !== 'undefined' &&
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [result.file] })
      ) {
        try {
          await navigator.share({
            title: `${docTitle} ${docNumber} - Jubilant Metal and Alloys`,
            text: messageText,
            files: [result.file],
          });
          sharedViaNative = true;
          success(`${docTitle} Shared`, `${docTitle} PDF and message shared successfully!`);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setIsGeneratingWhatsApp(false);
            return;
          }
          console.warn('Native share error, falling back:', shareErr);
        }
      }

      // 3. Browser-only fallback
      if (!sharedViaNative) {
        triggerFileDownload(result.blob, filename);

        const encoded = encodeURIComponent(messageText);
        const waUrl = cleanPhone
          ? `https://wa.me/${cleanPhone}?text=${encoded}`
          : `https://wa.me/?text=${encoded}`;
        window.open(waUrl, '_blank');

        setFallbackNotice({
          show: true,
          filename,
        });

        success(
          'WhatsApp Opened & PDF Downloaded',
          `${docTitle} PDF (${filename}) downloaded. Attach it in WhatsApp.`
        );
      }
    } catch (err: any) {
      console.error('WhatsApp share error:', err);
      // Fallback: open WhatsApp with text message
      const encoded = encodeURIComponent(messageText);
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      window.open(waUrl, '_blank');
      error('PDF Generation Notice', 'Opened WhatsApp with message. You can download the PDF manually below.');
    } finally {
      setIsGeneratingWhatsApp(false);
    }
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`${docTitle} ${docNumber} - Jubilant Metal and Alloys`);
    const body = encodeURIComponent(messageText);
    window.location.href = `mailto:${doc.customerEmail || ''}?subject=${subject}&body=${body}`;
  };

  const handleDirectDownload = async () => {
    setIsDownloadingPdf(true);
    const filename = `${docNumber}-Jubilant.pdf`;
    const docElementId = isProforma
      ? `share-modal-print-pi-${proforma!.id}`
      : `share-modal-print-doc-${quotation!.id}`;

    const pdfGen = isProforma ? createProformaPDF : createQuotationPDF;
    const res = await pdfGen({
      elementId: docElementId,
      filename,
      saveFile: false,
    });

    if (res.success && res.blob) {
      if (window.electronAPI?.savePDFToDisk) {
        try {
          const b64 = await blobToBase64(res.blob);
          await window.electronAPI.savePDFToDisk(b64, filename);
        } catch (e) {
          console.warn('Failed to save to disk via Electron:', e);
        }
      }
      triggerFileDownload(res.blob, filename);
      success('PDF Downloaded', `Downloaded ${filename}`);
    } else {
      error('Download Failed', 'Could not generate PDF. Please try again.');
    }
    setIsDownloadingPdf(false);
  };

  const handleShowInFolder = () => {
    if (fallbackNotice?.filePath && window.electronAPI?.showItemInFolder) {
      window.electronAPI.showItemInFolder(fallbackNotice.filePath);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isProforma ? 'Share Proforma Invoice' : 'Share Quotation'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {docNumber} • {customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm overflow-y-auto">
          {/* Fallback Notice Banner (shown after desktop WhatsApp click) */}
          {fallbackNotice?.show && (
            <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-300 text-xs space-y-2.5 animate-fade-in shadow-sm">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-emerald-900 text-sm">
                    {fallbackNotice.filePath ? 'PDF Attached & WhatsApp Chat Opened!' : 'PDF Downloaded & WhatsApp Chat Opened!'}
                  </p>
                  <p className="text-emerald-800 leading-relaxed">
                    {fallbackNotice.filePath
                      ? `The official ${docTitle.toLowerCase()} PDF has been generated and copied to your clipboard:`
                      : `The official ${docTitle.toLowerCase()} PDF has been generated and saved to your Downloads folder:`}
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-slate-800 shadow-2xs">
                    <FileText className="w-4 h-4 text-red-600" />
                    <span>{fallbackNotice.filename}</span>
                  </div>
                  <p className="text-emerald-900 font-medium pt-1">
                    {fallbackNotice.filePath ? (
                      <>👉 <strong>In the opened WhatsApp chat:</strong> Simply press <strong>Paste (Ctrl+V)</strong> to send <strong>{fallbackNotice.filename}</strong> together with the pre-filled message.</>
                    ) : (
                      <>👉 <strong>In the opened WhatsApp window:</strong> Click <strong>Attach (<Paperclip className="w-3.5 h-3.5 inline text-emerald-700" />) → Document</strong>, and select <strong>{fallbackNotice.filename}</strong>.</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-emerald-200">
                {fallbackNotice.filePath && window.electronAPI?.showItemInFolder && (
                  <button
                    type="button"
                    onClick={handleShowInFolder}
                    className="text-emerald-900 hover:text-emerald-950 font-bold underline flex items-center gap-1"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Show in Folder</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDirectDownload}
                  disabled={isDownloadingPdf}
                  className="text-emerald-900 hover:text-emerald-950 font-bold underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF Again</span>
                </button>
              </div>
            </div>
          )}

          {/* Share Channels: WhatsApp, Email, Copy Message */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Share Options
            </label>

            {/* 1. WhatsApp Action */}
            <button
              type="button"
              onClick={handleWhatsApp}
              disabled={isGeneratingWhatsApp}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all group disabled:opacity-75"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/20 text-white group-hover:scale-105 transition-transform">
                  {isGeneratingWhatsApp ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <MessageSquare className="w-5 h-5" />
                  )}
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold flex items-center gap-2">
                    <span>Share via WhatsApp</span>
                    <span className="text-[10px] uppercase font-bold bg-white/25 px-2 py-0.5 rounded-full">
                      With PDF
                    </span>
                  </div>
                  <p className="text-emerald-100 text-[11px] mt-0.5">
                    {isGeneratingWhatsApp
                      ? `Generating official ${docTitle.toLowerCase()} PDF (${pdfProgress}%)...`
                      : targetPhone
                      ? `Generates PDF & opens chat with ${targetPhone}`
                      : 'Generates PDF & opens WhatsApp share'}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 shrink-0" />
            </button>

            {/* 2. Email Action & 3. Copy Message Action */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleEmail}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-md shadow-slate-900/15 transition-all"
              >
                <Mail className="w-4 h-4 text-blue-400" />
                <span>Send via Email</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors border border-slate-200"
              >
                {copiedText ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-600" />
                )}
                <span>{copiedText ? 'Copied Message!' : 'Copy Message'}</span>
              </button>
            </div>
          </div>

          {/* Quick PDF Download & Direct Link */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Direct {docTitle} Link & PDF
              </label>
              <button
                type="button"
                onClick={handleDirectDownload}
                disabled={isDownloadingPdf}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Download PDF</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={docUrl}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-600 truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold shrink-0 transition-colors border border-slate-200"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Message Preview */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Pre-formatted Message Content</label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={5}
              value={messageText}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 font-sans resize-none leading-relaxed select-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Hidden off-screen document rendered with exact document data for PDF capture */}
        <div
          className="fixed left-0 top-0 pointer-events-none opacity-100 -z-50"
          style={{ width: '794px' }}
          aria-hidden="true"
        >
          {isProforma && proforma ? (
            <ProformaDocument
              proforma={proforma}
              id={`share-modal-print-pi-${proforma.id}`}
            />
          ) : quotation ? (
            <QuotationDocument
              quotation={quotation}
              id={`share-modal-print-doc-${quotation.id}`}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
