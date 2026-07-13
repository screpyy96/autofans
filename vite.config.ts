import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tailwindcss(), tsconfigPaths()],
  build: {
    // Code splitting optimization
    rollupOptions: {
      output: {
        // Keep a lazy dependency lazy. Rollup otherwise hoists an empty Mapbox
        // import into every route chunk, including the homepage.
        hoistTransitiveImports: false,
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('mapbox')) {
              return 'mapbox-vendor';
            }
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui-vendor';
            }
          }
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: false
  },
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
    exclude: ['@react-router/dev']
  },
});
