// lib/extractToken.ts
export function extractTokenFromHeader(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return null;

  // e.g. "Bearer <token-value>"
  if (!authHeader.startsWith("Bearer ")) return null;

  // Remove "Bearer " prefix
  return authHeader.slice(7).trim(); // or authHeader.replace(/^Bearer\s+/, '')
}
