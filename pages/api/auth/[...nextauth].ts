import { NextApiHandler } from 'next';
import NextAuth, { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import EmailProvider from 'next-auth/providers/email';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '../../../lib/prisma';
import { UserRole, StudyYear, User as PrismaUser } from '@prisma/client';
import bcrypt from 'bcryptjs';

// This interface is for the object returned by the authorize function
// It should be compatible with NextAuth's User type but can include our custom fields.
interface AuthorizeUser extends NextAuthUser {
  id: string;
  email: string; // email is required for NextAuthUser
  name?: string | null; // name is optional for NextAuthUser
  firstName: string; // Custom field
  lastName: string; // Custom field
  role: UserRole;   // Custom field, ensure it's always provided for our test user
  studyYear?: StudyYear | null; // Custom field
  image?: string | null; // Added for profile picture
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text", placeholder: "test@user.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<AuthorizeUser | null> {
        if (!credentials) return null;

        const testUserImage = "https://upload.wikimedia.org/wikipedia/commons/d/dc/Steve_Jobs_Headshot_2010-CROP_%28cropped_2%29.jpg";

        if (credentials.email === "test@user.com" && credentials.password === "12345") {
          let prismaUser = await prisma.user.findUnique({
            where: { email: "test@user.com" },
          });

          if (!prismaUser) {
            const hashedPassword = await bcrypt.hash("12345", 10);
            prismaUser = await prisma.user.create({
              data: {
                email: "test@user.com",
                password: hashedPassword,
                firstName: "Test",
                lastName: "User",
                emailVerified: new Date(),
                role: UserRole.STUDENT, // Assign a default role
                image: testUserImage, // Add image on creation
              },
            });
          } else {
            // User exists, verify password
            const userWithPassword = await prisma.user.findUnique({
              where: { email: "test@user.com" },
              select: { password: true } 
            });

            if (!userWithPassword || !userWithPassword.password) {
              console.error("Test user exists but password not found for comparison.");
              return null;
            }

            const passwordMatch = await bcrypt.compare(credentials.password, userWithPassword.password);
            if (!passwordMatch) {
              return null;
            }
            // If user exists and password matches, ensure their image is up-to-date in the database
            // This is optional, but good for consistency if the test image URL were to change in code
            if (prismaUser.image !== testUserImage) {
              prismaUser = await prisma.user.update({
                where: { email: "test@user.com" },
                data: { image: testUserImage },
              });
            }
          }
          
          // Ensure all fields for AuthorizeUser are present
          return {
            id: prismaUser.id,
            email: prismaUser.email!, 
            name: `${prismaUser.firstName} ${prismaUser.lastName}`,
            firstName: prismaUser.firstName!,
            lastName: prismaUser.lastName!,
            role: prismaUser.role, 
            studyYear: prismaUser.studyYear,
            image: prismaUser.image, // Return image
          };
        }
        return null;
      }
    }),
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
      // token should contain all the necessary user info from the jwt callback
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string | null; // Get image from token
        // Add custom properties from token to session.user
        (session.user as any).role = token.role as UserRole;
        (session.user as any).firstName = token.firstName as string;
        (session.user as any).lastName = token.lastName as string;
        (session.user as any).studyYear = token.studyYear as StudyYear | null;
      }
      return session;
    },
    async jwt({ token, user, account }) { 
      // The 'user' object here is the one returned by the 'authorize' callback or from OAuth provider
      if (user) { // This block runs on sign-in or when user object is available
        token.sub = user.id;
        token.email = user.email; 
        token.name = user.name;
        token.image = user.image; // Add image to token
        
        // Type assertion to access custom properties
        const authorizeUser = user as AuthorizeUser; 
        token.role = authorizeUser.role;
        token.firstName = authorizeUser.firstName;
        token.lastName = authorizeUser.lastName;
        token.studyYear = authorizeUser.studyYear;
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
