import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient, UserRole, StudyYear } from '@prisma/client';
import type { NextAuthOptions } from 'next-auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
    firstName: string;
    lastName: string;
    studyYear?: StudyYear | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      firstName: string;
      lastName: string;
      studyYear?: StudyYear | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          firstName: profile.given_name,
          lastName: profile.family_name,
          email: profile.email,
          image: profile.picture,
          role: 'STUDENT', // Default role
        };
      },
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          (user as any).password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
          role: token.role,
          firstName: token.firstName,
          lastName: token.lastName,
          studyYear: token.studyYear,
          isVerifiedLandlord: token.isVerifiedLandlord,
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.studyYear = (user as any).studyYear;
        token.isVerifiedLandlord = (user as any).isVerifiedLandlord;
      }
      return token;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
};
