import { defineConfig, loadEnv } from 'vite'

import react from '@vitejs/plugin-react'

/**
 * Vite configuration with environment-specific settings
 * @see https://vitejs.dev/config/
 */
export default defineConfig(({ command, mode }) => {
  // Load env file based on mode (development, production, etc.)
  const env = loadEnv(mode, process.cwd())
  
  // Base configuration common to all environments
  const baseConfig = {
    plugins: [react()],
    resolve: {
      alias: {
        // Add aliases here if needed 
        // '@': path.resolve(__dirname, './src'),
      }
    },
    // Global variables
    define: {
      'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
    }
  }
  
  // Environment-specific configurations
  if (mode === 'development') {
    return {
      ...baseConfig,
      server: {
        port: 5173,
        open: true, // Automatically open browser
        proxy: {
          '/api': {
            target: 'http://localhost:5001',
            changeOrigin: true, 
            secure: false,
            ws: true, // Support WebSocket
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('proxy error', err);
              });
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                console.log('Sending Request:', req.method, req.url);
              });
              proxy.on('proxyRes', (proxyRes, req, _res) => {
                console.log('Received Response from:', req.url, proxyRes.statusCode);
              });
            },
          }
        }
      },
      // Development-specific settings
      optimizeDeps: {
        // Force dependencies to be pre-bundled in development
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          '@tanstack/react-query',
          'axios'
        ]
      }
    }
  }
  
  if (mode === 'production') {
    return {
      ...baseConfig,
      // Production optimizations
      build: {
        outDir: 'dist',
        minify: 'terser',
        // Chunk split strategy
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom', 'react-router-dom'],
              ui: ['react-hot-toast', 'react-icons'],
              utils: ['date-fns', 'axios'],
              data: ['@tanstack/react-query']
            }
          }
        },
        // Reduce console output in production builds
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true
          }
        }
      },
      // Use relative paths for assets (for GitHub Pages, etc.)
      base: env.VITE_BASE_URL || '/'
    }
  }
  
  // Testing/staging configuration
  if (mode === 'staging') {
    return {
      ...baseConfig,
      // Staging specific settings
      build: {
        outDir: 'dist-staging',
        sourcemap: true, // Generate source maps for debugging
      }
    }
  }
  
  return baseConfig
})