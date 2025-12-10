import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'helixit.bmc.com',
      'localhost',
      '127.0.0.1',
      '.bmc.com',
      '10.129.152.5'
    ]
  }
});