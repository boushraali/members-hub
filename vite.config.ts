/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * مسار النشر يُضبط من متغير واحد VITE_BASE_PATH (الافتراضي "/" لنشر Vercel على جذر النطاق).
 * عند الدمج في موقع الجمعية: VITE_BASE_PATH=/site/members/ ← https://aia.org.sa/site/members/
 * ويُشتق منه basename الخاص بـ React Router تلقائيًا (انظر src/main.tsx).
 */
function normalizeBase(raw: string | undefined) {
  const trimmed = (raw ?? '').trim().replace(/^\/+|\/+$/g, '')
  return trimmed ? `/${trimmed}/` : '/'
}

export default defineConfig(({ mode }) => {
  // يقرأ ملفات .env ومتغيرات البيئة في الطرفية/Vercel معًا
  const env = loadEnv(mode, '.', 'VITE_')
  return {
    base: normalizeBase(env.VITE_BASE_PATH),
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  }
})
