import path from 'node:path';

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  // Mencegah Next.js salah mendeteksi root project jika ada package-lock.json di folder induk.
  outputFileTracingRoot: path.resolve(import.meta.dirname),
};
