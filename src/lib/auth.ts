import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

function getWholesaleCredentials() {
  const raw = process.env.WHOLESALE_CREDENTIALS || '';
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
        const accounts = getWholesaleCredentials();
        const account = accounts.find(
          (a) =>
            a.username === credentials?.username && a.password === credentials?.password
        );
        if (account) {
          return {
            id: account.username,
            name: account.name,
            email: `${account.username}@wholesale`,
          };
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
