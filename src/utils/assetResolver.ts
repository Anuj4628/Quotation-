import logoImg from '../assets/logo3.png';
import signatureImg from '../assets/signature.png';
import stampImg from '../assets/stamp.png';

export const DEFAULT_LOGO = logoImg;
export const DEFAULT_SIGNATURE = signatureImg;
export const DEFAULT_STAMP = stampImg;

/**
 * Safely resolves an image URL to either the bundled Vite asset (which resolves relative to index.html)
 * or a user-provided base64 Data URL or file URI.
 * Prevents broken root-slash (/logo.png) paths when running from file:// in packaged Electron.
 */
export function resolveLogoUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || url === '/logo.png' || url === '/logo3.png' || url.trim() === '') {
    return DEFAULT_LOGO;
  }
  return url;
}

export function resolveSignatureUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || url === '/signature.png' || url.trim() === '') {
    return DEFAULT_SIGNATURE;
  }
  return url;
}

export function resolveStampUrl(url?: string | null): string {
  if (!url || typeof url !== 'string' || url === '/stamp.png' || url.trim() === '') {
    return DEFAULT_STAMP;
  }
  return url;
}
