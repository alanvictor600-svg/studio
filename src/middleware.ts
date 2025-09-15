import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Este nome de cookie é um exemplo, o Firebase Auth (client-side) não usa cookies HTTP por padrão.
// O middleware verificará a existência de qualquer cookie que sugira uma sessão.
// A verificação real do token aconteceria em um cenário de produção mais complexo (ex: com Firebase Admin SDK).
const AUTH_COOKIE_NAME = '__session'; // Nome genérico para o cookie de sessão

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obtenha todos os cookies. O Firebase Auth SDK no cliente usa IndexedDB,
  // mas vamos procurar por um cookie de sessão que possa ser definido.
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);

  // Redireciona usuários logados para longe das páginas de login/cadastro
  if (sessionCookie && (pathname === '/login' || pathname === '/cadastrar')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Rotas protegidas
  const protectedRoutes = ['/admin', '/dashboard', '/cliente', '/vendedor', '/solicitar-saldo'];

  // Verifica se a rota é protegida e se o usuário não está logado
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // Adiciona o parâmetro de redirecionamento
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Configuração do Middleware
export const config = {
  matcher: [
    /*
     * Corresponde a todos os caminhos de solicitação, exceto aqueles que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (arquivos de otimização de imagem)
     * - favicon.ico (arquivo de favicon)
     * - logo.png (arquivo de logo)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)',
  ],
};
