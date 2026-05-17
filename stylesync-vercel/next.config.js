/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow images served from Vercel Blob storage
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },

  // Serve the static prototype from public/index.html when the user hits `/`.
  // beforeFiles runs before Next.js's file-based routing, so this wins
  // even though app/layout.tsx exists.
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/index.html' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

module.exports = nextConfig;
