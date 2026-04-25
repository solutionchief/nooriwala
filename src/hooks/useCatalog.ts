import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Product {
  id: string;
  user_id: string;
  collection_id: string | null;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  sku: string | null;
  images: string[];
  link: string | null;
  in_stock: boolean;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
}

export function useCatalog(userId?: string) {
  const { user } = useAuth();
  const ownerId = userId || user?.id;
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!ownerId) return;
    const [{ data: p }, { data: c }] = await Promise.all([
      supabase.from('products').select('*').eq('user_id', ownerId).order('created_at', { ascending: false }),
      supabase.from('product_collections').select('*').eq('user_id', ownerId).order('sort_order'),
    ]);
    setProducts((p as any) || []);
    setCollections((c as any) || []);
    setLoading(false);
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  const upsertProduct = async (data: Partial<Product> & { name: string; price: number }) => {
    if (!user) return;
    const payload = { user_id: user.id, ...data };
    const { error } = data.id
      ? await supabase.from('products').update(payload).eq('id', data.id)
      : await supabase.from('products').insert(payload as any);
    if (error) throw error;
    load();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    load();
  };

  const uploadImage = async (file: File): Promise<string> => {
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
  };

  const createCollection = async (name: string) => {
    if (!user) return;
    await supabase.from('product_collections').insert({ user_id: user.id, name });
    load();
  };

  return { products, collections, loading, upsertProduct, deleteProduct, uploadImage, createCollection, reload: load };
}
