import { randomUUID } from "node:crypto";
import supabase from "../config/supabase.js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "maatri-uploads";

const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

/**
 * Upload a file buffer to Supabase Storage.
 */
export const uploadFile = async ({ file, folder, userId }) => {
  const ext = file.originalname.includes(".")
    ? file.originalname.slice(file.originalname.lastIndexOf("."))
    : "";
  const storagePath = `${folder}/${userId}/${Date.now()}-${randomUUID()}${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60);

  const fileUrl = signError
    ? supabase.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl
    : signed.signedUrl;

  return {
    file_url: fileUrl,
    storage_path: storagePath,
    bucket: BUCKET,
    metadata: {
      original_name: file.originalname,
      mime_type: file.mimetype,
      size_bytes: file.size,
      uploaded_by: userId,
      uploaded_at: new Date().toISOString(),
    },
  };
};

export const uploadAudio = (file, userId) =>
  uploadFile({ file, folder: "audio", userId });

export const uploadImage = (file, userId) =>
  uploadFile({ file, folder: "images", userId });
