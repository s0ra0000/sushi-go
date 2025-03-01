import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("token");

  const { pathname } = req.nextUrl;

  if (
    accessToken &&
    (pathname === "/auth/login" || pathname === "/auth/sign-up")
  ) {
    return NextResponse.redirect(new URL("/games", req.url));
  }

  if (!accessToken && pathname.startsWith("/games")) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (!accessToken && pathname.startsWith("/games")) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/auth/login", "/auth/sign-up", "/games", "/games/:path*"],
};
