import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export const CHEMIN_CONNEXION = "/connexion";

const urlDeConnexion = (request: NextRequest): URL => {
  const url = new URL(CHEMIN_CONNEXION, request.url);
  const chemin = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  if (chemin && chemin !== "/") {
    url.searchParams.set("callbackUrl", chemin);
  }
  return url;
};

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const estAcmeChallenge = pathname.startsWith("/.well-known/acme-challenge/");

  if (
    request.headers.get("x-forwarded-proto") === "http" &&
    !estAcmeChallenge
  ) {
    const httpsUrl = new URL(request.nextUrl.toString());
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, { status: 308 });
  }

  const response = NextResponse.next();

  const isDev = process.env.NODE_ENV === "development";
  response.headers.set(
    "Content-Security-Policy",
    isDev
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'self'; form-action 'self'"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
  );

  const estRoutePublique =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith(CHEMIN_CONNEXION) ||
    pathname.startsWith("/api/admin/cron") ||
    estAcmeChallenge;

  if (!estRoutePublique) {
    const useSecureCookies =
      process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: useSecureCookies,
    });

    if (!token) {
      return NextResponse.redirect(urlDeConnexion(request), { status: 303 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!js/|_next/static|_next/image|favicon.ico|favicon/).+)"],
};
