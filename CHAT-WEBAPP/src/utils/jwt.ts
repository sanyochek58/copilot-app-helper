export type DecodedJwt = {
  sub?: string;       // email (subject)
  userId?: string;
  businessId?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Приводим base64url к обычному base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');

    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to decode JWT', e);
    return null;
  }
}
