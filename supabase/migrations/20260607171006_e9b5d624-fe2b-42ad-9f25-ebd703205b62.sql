CREATE POLICY "admins upload hero media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'store-media'
  AND (storage.foldername(name))[2] = 'hero'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "admins update hero media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'store-media'
  AND (storage.foldername(name))[2] = 'hero'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  bucket_id = 'store-media'
  AND (storage.foldername(name))[2] = 'hero'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

CREATE POLICY "admins delete hero media"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'store-media'
  AND (storage.foldername(name))[2] = 'hero'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);