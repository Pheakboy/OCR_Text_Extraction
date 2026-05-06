import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // ⚠️ Change '/OCR_Text_Extract/' to match your GitHub repository name exactly
  base: '/OCR_Text_Extract/',
  server: {
    host: true
  }
});
