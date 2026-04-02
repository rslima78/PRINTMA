import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Redirecionar raiz para login
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Verificar acesso por perfil
    if (pathname.startsWith("/admin") && token?.perfil !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/coordenador") && token?.perfil !== "COORDENADOR") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/operador") && token?.perfil !== "OPERADOR") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (pathname === "/login") return true;
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/", "/admin/:path*", "/coordenador/:path*", "/operador/:path*"],
};
