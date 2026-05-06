import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/OCR_Text_Extraction/',
  server: {
    host: true
  }
});
