// Multi-page document scanner dialog.
// Lets the user capture/pick multiple pages, preview them, reorder, retake,
// and remove pages before stitching into a single PDF and sending.
import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, ArrowUp, ArrowDown, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { imagesToPdf } from '@/lib/scanToPdf';
import { toast } from 'sonner';

interface Page { id: string; file: File; url: string; }

export default function ScanToPdfDialog({
  open,
  onOpenChange,
  onSend,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSend: (pdf: File) => Promise<void> | void;
}) {
  const [pages, setPages] = useState<Page[]>([]);
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      // Cleanup blob URLs when closing
      pages.forEach(p => URL.revokeObjectURL(p.url));
      setPages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const newPages: Page[] = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .map(f => ({ id: `${Date.now()}-${Math.random()}`, file: f, url: URL.createObjectURL(f) }));
    setPages(p => [...p, ...newPages]);
  };

  const remove = (id: string) => {
    setPages(p => {
      const found = p.find(x => x.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return p.filter(x => x.id !== id);
    });
  };

  const move = (id: string, dir: -1 | 1) => {
    setPages(p => {
      const i = p.findIndex(x => x.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const next = [...p];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const handleSend = async () => {
    if (!pages.length) return;
    setBusy(true);
    try {
      const blob = await imagesToPdf(pages.map(p => p.file));
      const file = new File([blob], `scan-${Date.now()}.pdf`, { type: 'application/pdf' });
      await onSend(file);
      onOpenChange(false);
      toast.success(`PDF sent (${pages.length} ${pages.length === 1 ? 'page' : 'pages'})`);
    } catch (e: any) {
      toast.error(e?.message || 'Could not build PDF');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" /> Scan to PDF
            {pages.length > 0 && (
              <span className="ml-auto rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                {pages.length} {pages.length === 1 ? 'page' : 'pages'}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <p className="mb-1 font-semibold">No pages yet</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Add pages from your camera or photo library. Reorder or remove before sending.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pages.map((p, i) => (
                <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    <img src={p.url} alt={`Page ${i + 1}`} className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">Page {i + 1}</p>
                    <p className="truncate text-xs text-muted-foreground">{Math.round(p.file.size / 1024)} KB</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => move(p.id, -1)}
                      className="rounded p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Move down"
                      disabled={i === pages.length - 1}
                      onClick={() => move(p.id, 1)}
                      className="rounded p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    aria-label="Remove page"
                    onClick={() => remove(p.id)}
                    className="rounded p-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
          />

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => cameraRef.current?.click()} disabled={busy}>
              <Camera className="mr-2 h-4 w-4" /> Capture page
            </Button>
            <Button variant="secondary" onClick={() => galleryRef.current?.click()} disabled={busy}>
              <ImagePlus className="mr-2 h-4 w-4" /> Add from library
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-border p-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            <X className="mr-1 h-4 w-4" /> Cancel
          </Button>
          <Button onClick={handleSend} disabled={!pages.length || busy} className="flex-1">
            {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building PDF…</> : <>Send as PDF</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
