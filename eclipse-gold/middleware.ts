import { NextResponse, type NextRequest } from 'next/server'
import { countryFromHeader } from './lib/geo'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect bare root to the default language.
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/fr'
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  if (!request.cookies.has('eg-country')) {
    const country = countryFromHeader(request.headers.get('x-vercel-ip-country'))
    response.cookies.set('eg-country', country, { path: '/', sameSite: 'lax' })
  }
  return response
}

export const config = {
  // Run on pages only, skip static assets and API.
  matcher: ['/((?!_next|api|.*\\..*).*)'],
}
