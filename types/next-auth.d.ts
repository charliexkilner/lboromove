import { StudyYear, UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      firstName: string;
      lastName: string;
      studyYear?: StudyYear | null;
    }
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: UserRole;
    firstName: string;
    lastName: string;
    studyYear?: StudyYear | null;
  }
} 