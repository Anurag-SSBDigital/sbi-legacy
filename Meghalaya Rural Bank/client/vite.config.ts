import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// import { unstableRolldownAdapter } from 'vite-bundle-analyzer'
// import { analyzer } from 'vite-bundle-analyzer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: env.VITE_BASE_PATH ?? '/',  
    experimental: { enableNativePlugin: true },
    build: {
      chunkSizeWarningLimit: 1500,
    },
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
      // unstableRolldownAdapter(analyzer({ analyzerMode: 'erver' })),
    ],
    server: { allowedHosts: true },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // fix loading all icon chunks in dev mode
        // https://github.com/tabler/tabler-icons/issues/1233
        '@tabler/icons-react': '@tabler/icons-react/dist/esm/icons/index.mjs',
      },
    },
  }
})
