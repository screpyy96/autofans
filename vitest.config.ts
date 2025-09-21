import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./app/test/setup.ts'],
    include: ['app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'build', '.react-router'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'app/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/demo/**',
        'build/',
        '.react-router/'
      ]
    },
    // Performance settings
    testTimeout: 10000,
    hookTimeout: 10000,
    // Mock browser APIs
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true
      }
    }
  },
  // Resolve aliases for testing
  resolve: {
    alias: {
      '~': '/app'
    }
  }
});