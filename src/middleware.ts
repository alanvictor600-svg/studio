import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// O middleware agora simplesmente permite que a requisição passe.
// A lógica de proteção de rota e redirecionamento é tratada de forma mais eficaz
// no lado do cliente, dentro dos layouts de rota protegida (ex: /dashboard/layout.tsx),
// usando o contexto de autenticação. Isso evita conflitos e loops de redirecionamento.
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// A configuração do matcher permanece para definir quais rotas passam pelo middleware.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - logo.png
     * - manifest.json
     * - sw.js (e variações como sw-v2.js)
     * - icons/ (ícones do PWA)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png|manifest.json|sw.*.js|icons/).*)',
  ],
}
