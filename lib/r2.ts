import { S3Client } from '@aws-sdk/client-s3'

// Cloudflare R2 uses the AWS S3-compatible API.
// R2 has zero egress fees and Cloudflare CDN nodes near Ghana (Lagos, Jo'burg).
// All image uploads go here instead of Supabase Storage.
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export const R2_BUCKET = process.env.R2_BUCKET_NAME!

// Public URL for the bucket (e.g. https://pub-xxx.r2.dev or https://images.campusconnect.gh)
export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!
