import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

const ADMIN_COOKIE = 'admin-session';
const SESSION_TOKEN = 'authenticated';

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  // Support both plain text and bcrypt hashed passwords
  if (adminPassword.startsWith('$2')) {
    return bcrypt.compare(password, adminPassword);
  }
  return password === adminPassword;
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, SESSION_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE);
  return session?.value === SESSION_TOKEN;
}
