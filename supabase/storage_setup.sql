-- Supabase Storage bucket for Maatri file uploads
-- Run in Supabase Dashboard → Storage → or SQL Editor

INSERT INTO storage.buckets (id, name, public)
VALUES ('maatri-uploads', 'maatri-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Allow service role full access (backend uses service_role key)
CREATE POLICY IF NOT EXISTS "Service role storage access"
ON storage.objects FOR ALL
USING (bucket_id = 'maatri-uploads')
WITH CHECK (bucket_id = 'maatri-uploads');
