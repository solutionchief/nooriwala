import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ScanLine, Camera, RotateCcw, Download, Trash2, Plus, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

// Built-in document scanner (CamScanner-style):
// 1. Capture from camera (or file) → 2. Auto enhance (B/W or Color) → 3. Crop frame → 4. Stack multiple pages → 5. Export PDF.

interface Page { id: string; dataUrl: string; }

export default function ScannerScreen({ onBack, onSendToChat }: { onBack: () => void; onSendToChat?: (file: File) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [streamReady, setStreamReady] = useState(false);
  const [pages, setPages] = useState<Page[]>([]);
  const [filter, setFilter] = useState<'color' | 'bw' | 'enhance'>('enhance');
  const [stage, setStage] = useState<'capture' | 'review'>('capture');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreamReady(true);
        }
      } catch {
        toast.error('Camera unavailable — use the gallery button instead');
      }
    })();
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  const applyFilter = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    if (filter === 'color') return;
    const contrast = filter === 'enhance' ? 1.35 : 1.6;
    const brightness = filter === 'enhance' ? 12 : 22;
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lum = (lum - 128) * contrast + 128 + brightness;
      lum = Math.max(0, Math.min(255, lum));
      if (filter === 'bw') { d[i] = d[i + 1] = d[i + 2] = lum; }
      else { // enhance: keep slight color, boost
        const k = lum / (0.299 * r + 0.587 * g + 0.114 * b || 1);
        d[i] = Math.min(255, r * k);
        d[i + 1] = Math.min(255, g * k);
        d[i + 2] = Math.min(255, b * k);
      }
    }
    ctx.putImageData(img, 0, 0);
  };

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setProcessing(true);
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(v, 0, 0);
    applyFilter(ctx, c.width, c.height);
    const dataUrl = c.toDataURL('image/jpeg', 0.9);
    setPages(p => [...p, { id: crypto.randomUUID(), dataUrl }]);
    setProcessing(false);
    toast.success(`Page ${pages.length + 1} added`);
  };

  const importFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const c = canvasRef.current!; c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      applyFilter(ctx, c.width, c.height);
      setPages(p => [...p, { id: crypto.randomUUID(), dataUrl: c.toDataURL('image/jpeg', 0.9) }]);
    };
    img.src = URL.createObjectURL(file);
  };

  const exportPdf = async () => {
    if (pages.length === 0) return toast.error('Add at least one page');
    // Build a simple multi-page PDF natively (no library) by composing JPEG pages.
    // We use the printable approach: open new window with images and trigger print → Save as PDF.
    const html = `<html><head><title>Scan</title><style>
      @page { margin: 0; size: A4; }
      body { margin: 0; }
      img { width: 100vw; height: 100vh; object-fit: contain; page-break-after: always; display: block; }
      img:last-child { page-break-after: auto; }
    </style></head><body>
      ${pages.map(p => `<img src="${p.dataUrl}" />`).join('')}
      <script>window.onload = () => setTimeout(() => window.print(), 300);</script>
    </body></html>`;
    const w = window.open('', '_blank');
    if (!w) return toast.error('Pop-up blocked — allow pop-ups to export');
    w.document.write(html); w.document.close();
  };

  const sendFirstToChat = async () => {
    if (!pages[0] || !onSendToChat) return;
    const blob = await (await fetch(pages[0].dataUrl)).blob();
    const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
    onSendToChat(file);
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-3">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <ScanLine className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold flex-1">Scanner</h1>
        {pages.length > 0 && <span className="text-xs text-muted-foreground">{pages.length} page{pages.length > 1 ? 's' : ''}</span>}
      </div>

      {stage === 'capture' ? (
        <div className="relative flex-1 bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {/* Document frame overlay */}
          <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-dashed border-primary/70" />
          {!streamReady && <div className="absolute inset-0 flex items-center justify-center text-white">Starting camera…</div>}

          <div className="absolute left-0 right-0 bottom-24 flex justify-center gap-2 px-4">
            {(['color', 'enhance', 'bw'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-black/40 text-white'}`}>
                {f === 'color' ? 'Color' : f === 'enhance' ? 'Enhance' : 'B&W'}
              </button>
            ))}
          </div>

          <div className="absolute inset-x-0 bottom-4 flex items-center justify-around px-4">
            <button onClick={() => fileRef.current?.click()} className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-black">
              <Plus className="h-5 w-5" />
            </button>
            <button onClick={capture} disabled={processing}
              className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-primary disabled:opacity-50">
              <Camera className="h-7 w-7 text-primary-foreground" />
            </button>
            <button onClick={() => setStage('review')} disabled={pages.length === 0}
              className="flex h-12 w-12 flex-col items-center justify-center rounded-full bg-white/90 text-black disabled:opacity-40">
              <FileText className="h-5 w-5" />
              <span className="text-[10px] font-bold">{pages.length}</span>
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={importFile} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-secondary p-3 space-y-3">
          {pages.map((p, i) => (
            <div key={p.id} className="relative rounded-lg bg-card p-2 shadow">
              <img src={p.dataUrl} alt={`page ${i + 1}`} className="w-full rounded" />
              <div className="absolute right-3 top-3 flex gap-2">
                <button onClick={() => setPages(prev => prev.filter(x => x.id !== p.id))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Page {i + 1}</p>
            </div>
          ))}
          {pages.length === 0 && <p className="py-12 text-center text-sm text-muted-foreground">No pages yet</p>}
        </div>
      )}

      <div className="flex gap-2 border-t border-border bg-card p-3">
        {stage === 'capture' ? (
          <Button variant="secondary" className="flex-1" onClick={() => setStage('review')} disabled={pages.length === 0}>
            Review ({pages.length})
          </Button>
        ) : (
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setStage('capture')}>
              <RotateCcw className="mr-1 h-4 w-4" /> More pages
            </Button>
            {onSendToChat && (
              <Button className="flex-1" onClick={sendFirstToChat}>Send to chat</Button>
            )}
            <Button className="flex-1" onClick={exportPdf}>
              <Download className="mr-1 h-4 w-4" /> Export PDF
            </Button>
          </>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
