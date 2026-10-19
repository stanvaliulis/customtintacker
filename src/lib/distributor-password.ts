import bcrypt from 'bcryptjs';

export async function hashDistributorPassword(password: string): Promise<string> {
  // bcrypt truncates beyond 72 bytes. Never silently accept equivalent passwords.
  if (Buffer.byteLength(password, 'utf8') < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Password must contain 12 to 72 UTF-8 bytes');
  }
  return bcrypt.hash(password, 12);
}

export async function verifyDistributorPassword(password: string, hash: string): Promise<boolean> {
  if (Buffer.byteLength(password, 'utf8') > 72 || !/^\$2[aby]\$12\$/.test(hash)) return false;
  return bcrypt.compare(password, hash);
}
