import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { findDistributorByEmail, parseEnvCredentials } from '@/lib/distributors';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Distributor Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string)?.trim().toLowerCase();
        const password = (credentials?.password as string)?.trim();
        if (!email || !password) return null;

        // 1. Check WHOLESALE_CREDENTIALS env var (format: "email:password:name")
        const envAccounts = parseEnvCredentials();
        const envMatch = envAccounts.find(
          (a) => a.email.toLowerCase() === email && a.password === password
        );
        if (envMatch) {
          return {
            id: envMatch.email,
            name: envMatch.companyName,
            email: envMatch.email,
            role: 'distributor',
            companyName: envMatch.companyName,
            asiNumber: '',
            sageNumber: '',
            ppaiNumber: '',
            discountTier: 0.40,
          } as Record<string, unknown>;
        }

        // 2. Check data/distributors.json for approved distributors
        const distributor = findDistributorByEmail(email);
        if (distributor && distributor.password === password) {
          return {
            id: distributor.email,
            name: distributor.contactName || distributor.companyName,
            email: distributor.email,
            role: 'distributor',
            companyName: distributor.companyName,
            asiNumber: distributor.asiNumber || '',
            sageNumber: distributor.sageNumber || '',
            ppaiNumber: distributor.ppaiNumber || '',
            discountTier: distributor.discountTier ?? 0.40,
          } as Record<string, unknown>;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as string || 'distributor';
        token.companyName = (user as Record<string, unknown>).companyName as string || '';
        token.asiNumber = (user as Record<string, unknown>).asiNumber as string || '';
        token.sageNumber = (user as Record<string, unknown>).sageNumber as string || '';
        token.ppaiNumber = (user as Record<string, unknown>).ppaiNumber as string || '';
        token.discountTier = (user as Record<string, unknown>).discountTier as number ?? 0.40;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.companyName = token.companyName;
        session.user.asiNumber = token.asiNumber;
        session.user.sageNumber = token.sageNumber;
        session.user.ppaiNumber = token.ppaiNumber;
        session.user.discountTier = token.discountTier;
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
  trustHost: true,
});
