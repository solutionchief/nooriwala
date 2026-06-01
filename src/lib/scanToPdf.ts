// Built-in document scanner → PDF converter for chats.
// Uses the device camera (capture="environment") to grab one or more JPEGs
// and stitches them into a single PDF using jsPDF.
import { jsPDF } from 'jspdf';

export async function imagesToPdf(files: File[]): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < files.length; i++) {
    const dataUrl = await readAsDataUrl(files[i]);
    const dims = await imageSize(dataUrl);
    // Fit-to-page, preserve aspect ratio
    const ratio = Math.min(pageW / dims.w, pageH / dims.h);
    const w = dims.w * ratio;
    const h = dims.h * ratio;
    const x = (pageW - w) / 2;
    const y = (pageH - h) / 2;
    if (i > 0) pdf.addPage();
    const fmt = files[i].type.includes('png') ? 'PNG' : 'JPEG';
    pdf.addImage(dataUrl, fmt, x, y, w, h);
  }
  return pdf.output('blob');
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function imageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = src;
  });
}
