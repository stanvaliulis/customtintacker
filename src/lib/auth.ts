import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { isDatabaseConfigured } from '@/lib/env';

function getWholesaleCredentials() {
  const raw = process.env.WHOLESALE_CREDENTIALS || '';
  if (!raw) return [];
  return raw.split(',').map((entry) => {
    const [username, password, name] = entry.split(':');
    return {
      username: username?.trim(),
      password: password?.trim(),
      name: name?.trim() || username?.trim(),
    };
  });
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Wholesale Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.username as string)?.trim();
        const password = (credentials?.password as string)?.trim();
        if (!email || !password) return null;

        // 1. Check hardcoded env var credentials (legacy)
        const accounts = getWholesaleCredentials();
        const envAccount = accounts.find(
          (a) => a.username === email && a.password === password
        );
        if (envAccount) {
          return {
            id: envAccount.username,
            name: envAccount.name,
            email: `${envAccount.username}@wholesale`,
          };
        }

        // 2. Check approved distributors in database
        if (isDatabaseConfigured()) {
          try {
            const { prisma } = await import('@/lib/db');
            const distributor = await prisma.distributorApplication.findFirst({
              where: { email, status: 'approved' },
            });

            if (distributor && distributor.notes) {
              // Extract the bcrypt hash from notes field
              const hashMatch = distributor.notes.match(/Temp password hash: (\$2[aby]\$.+)/);
              if (hashMatch) {
                const isValid = await bcrypt.compare(password, hashMatch[1]);
                if (isValid) {
                  return {
                    id: distributor.id,
                    name: distributor.contactName,
                    email: distributor.email,
                  };
                }
              }
            }
          } catch (err) {
            console.error('Distributor auth check failed:', err);
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = 'wholesale';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as Record<string, unknown>).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/wholesale/login',
  },
  session: {
    strategy: 'jwt',
  },
});
