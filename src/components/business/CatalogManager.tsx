import { useState, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Image as ImageIcon, X } from 'lucide-react';
import { useCatalog, type Product } from '@/hooks/useCatalog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function CatalogManager({ onBack }: { onBack: () => void }) {
  const { products, upsertProduct, deleteProduct, uploadImage, loading } = useCatalog();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!editing?.name || editing.price === undefined) { toast.error('Name and price required'); return; }
    if (products.length >= 500 && !editing.id) { toast.error('Max 500 products'); return; }
    try {
      await upsertProduct(editing as any);
      toast.success('Saved');
      setEditing(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    try {
      const url = await uploadImage(file);
      setEditing({ ...editing, images: [...(editing.images || []), url].slice(0, 9) });
    } catch (err: any) { toast.error(err.message); }
    e.target.value = '';
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <button onClick={onBack}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="flex-1 text-lg font-bold text-foreground">Catalog ({products.length}/500)</h1>
        <Button size="sm" onClick={() => setEditing({ name: '', price: 0, currency: 'USD', images: [], in_stock: true })}>
          <Plus className="h-4 w-4 mr-1" />Add
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? <p className="text-center text-sm text-muted-foreground">Loading…</p> : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No products yet. Tap Add to start.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map(p => (
              <div key={p.id} className="rounded-xl bg-card overflow-hidden">
                <div className="aspect-square bg-secondary">
                  {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" loading="lazy" />}
                </div>
                <div className="p-2">
                  <p className="font-medium text-sm truncate">{p.name}</p>
                  <p className="text-xs text-primary font-semibold">{p.currency} {p.price}</p>
                  <div className="mt-1 flex gap-1">
                    <button onClick={() => setEditing(p)} className="flex-1 rounded bg-secondary py-1 text-xs"><Edit2 className="h-3 w-3 inline" /></button>
                    <button onClick={() => deleteProduct(p.id)} className="flex-1 rounded bg-destructive/10 text-destructive py-1 text-xs"><Trash2 className="h-3 w-3 inline" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing?.id ? 'Edit' : 'New'} Product</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <Input placeholder="Name" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              <div className="flex gap-2">
                <Input type="number" placeholder="Price" value={editing.price ?? ''} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} />
                <Input placeholder="Currency" value={editing.currency || 'USD'} onChange={e => setEditing({ ...editing, currency: e.target.value })} className="w-20" />
              </div>
              <Input placeholder="SKU (optional)" value={editing.sku || ''} onChange={e => setEditing({ ...editing, sku: e.target.value })} />
              <Textarea placeholder="Description" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} />
              <Input placeholder="Product URL (optional)" value={editing.link || ''} onChange={e => setEditing({ ...editing, link: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.in_stock !== false} onChange={e => setEditing({ ...editing, in_stock: e.target.checked })} />
                In stock
              </label>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Images ({(editing.images || []).length}/9)</p>
                <div className="grid grid-cols-3 gap-2">
                  {(editing.images || []).map((url, i) => (
                    <div key={i} className="relative aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover rounded" />
                      <button onClick={() => setEditing({ ...editing, images: editing.images!.filter((_, j) => j !== i) })} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {(editing.images || []).length < 9 && (
                    <button onClick={() => fileRef.current?.click()} className="aspect-square rounded border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                      <Plus className="h-5 w-5" />
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
