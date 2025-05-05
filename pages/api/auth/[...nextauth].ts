import { NextApiHandler } from 'next';
import NextAuth, { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import { prisma } from '../../../lib/prisma';
import { UserRole } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // Check if this Google account already exists
      const userExists = await prisma.user.findUnique({
        where: { email: user.email },
        include: { accounts: true },
      });

      if (userExists) {
        // If the user exists but doesn't have a Google account linked
        if (!userExists.accounts.some(acc => acc.provider === 'google')) {
          // Link the Google account to the existing user
          await prisma.account.create({
            data: {
              userId: userExists.id,
              type: account?.type || 'oauth',
              provider: 'google',
              providerAccountId: account?.providerAccountId || '',
              access_token: account?.access_token,
              token_type: account?.token_type,
              scope: account?.scope,
              id_token: account?.id_token,
              session_state: account?.session_state,
            },
          });
        }
        return true;
      }

      // If no user exists, create a new one
      if (account?.provider === "google") {
        const nameParts = user.name?.split(" ") || ["", ""];
        await prisma.user.create({
          data: {
            email: user.email,
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(" "),
            image: user.image,
            role: 'STUDENT' as UserRole,
            accounts: {
              create: {
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              },
            },
          },
        });
      }
      return true;
    },
    async session({ session, token }) {
      // Fetch the user from the database to get the correct ID
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        select: {
          id: true,
          role: true,
          firstName: true,
          lastName: true,
          image: true,
          studyYear: true,
        },
      });

      if (!user) {
        throw new Error('User not found in session callback');
      }

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          role: user.role,
          // Map firstName/lastName to name for compatibility
          name: session.user.name || `${user.firstName} ${user.lastName}`,
          studyYear: user.studyYear,
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        // Only update the token when we have user data (on sign in)
        return {
          ...token,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          studyYear: user.studyYear,
        };
      }
      return token;
    }
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
};

const authHandler: NextApiHandler = NextAuth(authOptions);
export default authHandler;
