import type { NextConfig } from 'next'
import path from 'node:path'
import { readFileSync, existsSync } from 'node:fs'

// Carrega .env.local da raiz do monorepo quando a API roda em apps/api
function loadRootEnv(): void {
  try {
    const cwd = process.cwd()
    const root = cwd.endsWith('api') && cwd.includes('apps') ? path.resolve(cwd, '..', '..') : cwd
    const envPath = path.join(root, '.env.local')
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf8')
      for (const line of content.split('\n')) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
      }
    }
  } catch (_) {
    // ignora
  }
}
loadRootEnv()

const nextConfig: NextConfig = {
  // Permitir requisições do frontend em dev
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:8080' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ]
  },
  // pdfjs-dist requer tratamento especial (Next.js 15 moveu para serverExternalPackages)
  serverExternalPackages: ['pdfjs-dist'],
}

export default nextConfig
