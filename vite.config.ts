import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import {
  isNativeServerDep,
  nativeServerDepExternals,
} from './src/server/lib/native-server-deps'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const port = Number.parseInt(env.PORT || '3000', 10)

  return {
    resolve: { tsconfigPaths: true },
    ssr: {
      external: [...nativeServerDepExternals],
    },
    environments: {
      ssr: {
        resolve: {
          external: [...nativeServerDepExternals],
        },
      },
    },
    optimizeDeps: {
      exclude: ['@napi-rs/canvas', 'sharp', 'pdfjs-dist'],
    },
    server: {
      port: Number.isFinite(port) ? port : 3000,
      strictPort: true,
    },
    preview: {
      port: Number.isFinite(port) ? port : 3000,
      strictPort: true,
    },
    plugins: [
      nitro({
        rollupConfig: {
          external: (id: string) =>
            isNativeServerDep(id) ||
            /^@sentry\//.test(id) ||
            /^@adobe\//.test(id),
        },
      }),
      tanstackStart(),
      viteReact(),
      tailwindcss(),
    ],
  }
})
