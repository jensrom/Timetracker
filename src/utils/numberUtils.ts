export function generateCaseNumber(counter: number): string {
  const year = new Date().getFullYear();
  return `SAG-${year}-${String(counter).padStart(3, '0')}`;
}

export function generateTaskNumber(counter: number): string {
  const year = new Date().getFullYear();
  return `OPG-${year}-${String(counter).padStart(3, '0')}`;
}

export async function hashPassword(password: string): Promise<string> {
  const buf = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return (await hashPassword(password)) === hash;
}

// Pre-computed SHA-256 of "admin1234"
export const DEFAULT_ADMIN_PASSWORD_HASH =
  'b9c950640e1b3740743070bfbc898ea9db53e1c55daf9d1665a3477e31c7f6d8';
