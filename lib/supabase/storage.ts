import { getSupabaseServerClient } from "@/lib/supabase/client";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const readyBuckets = new Set<string>();

export async function uploadVisualSearchAsset(file: File) {
  return uploadPublicImageAsset(file, "visual-search");
}

export async function uploadPriceMatchEvidence(file: File) {
  return uploadPublicImageAsset(file, "price-match-evidence");
}

async function uploadPublicImageAsset(file: File, bucketName: string) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, or WebP image.");
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error("Please keep uploaded images under 10 MB.");
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase storage is not configured yet.");
  }

  await ensurePublicImageBucket(bucketName);

  const extension = guessExtension(file.type, file.name);
  const objectPath = `uploads/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage.from(bucketName).upload(objectPath, bytes, {
    contentType: file.type,
    upsert: false
  });

  if (uploadError) {
    throw new Error(`Could not store uploaded image: ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(objectPath);
  return {
    bucket: bucketName,
    objectPath,
    publicUrl: data.publicUrl
  };
}

async function ensurePublicImageBucket(bucketName: string) {
  if (readyBuckets.has(bucketName)) return;
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Supabase storage is not configured yet.");

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    throw new Error(`Could not verify storage bucket: ${listError.message}`);
  }

  const exists = (buckets || []).some((bucket) => bucket.name === bucketName);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: `${MAX_UPLOAD_SIZE_BYTES}`,
      allowedMimeTypes: Array.from(ALLOWED_IMAGE_TYPES)
    });
    if (createError && !/already exists/i.test(createError.message)) {
      throw new Error(`Could not create storage bucket: ${createError.message}`);
    }
  }

  readyBuckets.add(bucketName);
}

function guessExtension(mimeType: string, fileName: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) return fromName === "jpeg" ? "jpg" : fromName;
  return "jpg";
}
