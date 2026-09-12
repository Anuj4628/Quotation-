import React from 'react';
import { ProformaInvoice } from '../../types';
import { ShareModal } from '../quotation/ShareModal';

export interface ProformaShareModalProps {
  proforma: ProformaInvoice;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ProformaShareModal delegates to the unified, battle-tested ShareModal.
 * This guarantees 100% parity with Quotation Share for layout, typography,
 * button hierarchy, WhatsApp sending, and PDF generation & download.
 */
export const ProformaShareModal: React.FC<ProformaShareModalProps> = ({ proforma, isOpen, onClose }) => {
  return <ShareModal proforma={proforma} isOpen={isOpen} onClose={onClose} />;
};
