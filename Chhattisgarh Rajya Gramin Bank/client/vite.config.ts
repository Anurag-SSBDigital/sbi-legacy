import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// import { unstableRolldownAdapter } from 'vite-bundle-analyzer'
// import { analyzer } from 'vite-bundle-analyzer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isPublicMode = mode === 'public'
  const routesDirectory = isPublicMode ? './src/routes-public' : './src/routes'
  const generatedRouteTree = './src/routeTree.gen.ts'
  const surfaceAliases = isPublicMode
    ? [
        {
          find: '@/lib/route-permissions',
          replacement: path.resolve(
            __dirname,
            './src/lib/route-permissions.public.ts'
          ),
        },
        {
          find: '@/components/layout/data/sidebar-data',
          replacement: path.resolve(
            __dirname,
            './src/components/layout/data/sidebar-data.public.ts'
          ),
        },
        {
          find: '@/components/breadcrumb/auto-app-breadcrumb.tsx',
          replacement: path.resolve(
            __dirname,
            './src/components/breadcrumb/auto-app-breadcrumb.public.tsx'
          ),
        },
        {
          find: '@/components/layout/app-sidebar',
          replacement: path.resolve(
            __dirname,
            './src/components/layout/app-sidebar.public.tsx'
          ),
        },
      ]
    : []

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
        routesDirectory,
        generatedRouteTree,
      }),
      react(),
      tailwindcss(),
      // unstableRolldownAdapter(analyzer({ analyzerMode: 'erver' })),
    ],
    server: { allowedHosts: true },
    resolve: {
      alias: [
        ...surfaceAliases,
        // fix loading all icon chunks in dev mode
        // https://github.com/tabler/tabler-icons/issues/1233
        {
          find: '@tabler/icons-react',
          replacement: '@tabler/icons-react/dist/esm/icons/index.mjs',
        },
        {
          find: '@',
          replacement: path.resolve(__dirname, './src'),
        },
      ],
    },
  }
})
