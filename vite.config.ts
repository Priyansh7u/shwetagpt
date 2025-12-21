import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Inject the hackathon API key into the browser environment
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || 'AIzaSyAiQZjkyvCjZJSYASP9Bf9u2kXV-SrZwOo'),
  },
  server: {
    port: 3000,
  },
});