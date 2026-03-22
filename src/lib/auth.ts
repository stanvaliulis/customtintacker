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
      name: 'Distributor Login',
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
            role: 'distributor',
            companyName: envAccount.name,
            asiNumber: '',
            sageNumber: '',
            ppaiNumber: '',
            discountTier: 0.40,
          } as Record<string, unknown>;
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
                    role: 'distributor',
                    companyName: distributor.companyName,
                    asiNumber: distributor.asiNumber || '',
                    sageNumber: distributor.sageNumber || '',
                    ppaiNumber: distributor.ppaiNumber || '',
                    discountTier: 0.40,
                  } as Record<string, unknown>;
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
        const u = user as Record<string, unknown>;
        token.role = u.role || 'distributor';
        token.companyName = u.companyName || '';
        token.asiNumber = u.asiNumber || '';
        token.sageNumber = u.sageNumber || '';
        token.ppaiNumber = u.ppaiNumber || '';
        token.discountTier = u.discountTier ?? 0.40;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as unknown as Record<string, unknown>;
        user.role = token.role;
        user.companyName = token.companyName;
        user.asiNumber = token.asiNumber;
        user.sageNumber = token.sageNumber;
        user.ppaiNumber = token.ppaiNumber;
        user.discountTier = token.discountTier;
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
