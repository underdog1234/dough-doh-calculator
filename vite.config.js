import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// On GitHub Actions the app is served from /dough-doh-calculator/ (GitHub Pages project site).
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/dough-doh-calculator/' : '/',
  plugins: [react(), tailwindcss()],
});
