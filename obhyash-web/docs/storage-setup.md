# Hybrid Storage Setup Guide

This project uses a hybrid storage approach:

- **Supabase Storage**: Used for user profile pictures (Avatars).
- **Cloudflare R2**: Used for all other large assets (Questions, OMR Scripts, Resources).

## 1. Environment Variables

Ensure the following variables are set in your `.env.local` file:

```env
# --- Supabase Config ---
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# --- Cloudflare R2 Config ---
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=your_r2_bucket_name

# Domain for R2 public access (e.g., https://pub-xxx.r2.dev or custom domain)
# This is used by the client to display images.
NEXT_PUBLIC_R2_DOMAIN=pub-xxxxxxxxxxxxxxxxxxxx.r2.dev
```

## 2. Supabase Storage Setup

1. Go to your Supabase Project -> Storage.
2. Create a new public bucket named `avatars`.
3. Ensure "Public" is checked.
4. (Optional) Set up RLS policies if you want to restrict uploads to authenticated users only.

## 3. Cloudflare R2 Setup

1. Go to Cloudflare Dashboard -> R2.
2. Create a bucket (e.g., `obhyash-assets`).
3. **CORS Configuration**:
   You must allow your local and production domains to PUT files to the bucket.
   Go to Settings -> CORS Policy and add:

   ```json
   [
     {
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://your-production-domain.com"
       ],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedHeaders": ["Content-Type"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

4. **Public Access**:
   - Enable "R2.dev subdomain" or connect a custom domain.
   - Copy the domain and set it as `NEXT_PUBLIC_R2_DOMAIN` in `.env.local`.

## 4. Usage in Code

Use the `storage-service.ts` helper functions:

```typescript
import {
  uploadAvatar,
  uploadQuestionImage,
  uploadScriptImage,
} from '@/services/storage-service';

// For Avatars (Supabase)
const { url } = await uploadAvatar(file);

// For Questions (R2)
const { url } = await uploadQuestionImage(file);
```
