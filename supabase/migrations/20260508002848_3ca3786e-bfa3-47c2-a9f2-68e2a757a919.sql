UPDATE storage.buckets SET public = true WHERE id IN ('message-media','status-media');

DROP POLICY IF EXISTS "Authenticated read message-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated read status-media" ON storage.objects;

CREATE POLICY "Public read message-media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'message-media');

CREATE POLICY "Public read status-media"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'status-media');