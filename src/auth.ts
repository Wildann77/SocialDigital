import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Google } from "arctic";
import { Lucia, Session, User } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";
import prisma from "./lib/prisma";

const adapter = new PrismaAdapter(prisma.session, prisma.user);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    expires: false,
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes(databaseUserAttributes) {
    return {
      id: databaseUserAttributes.id,
      username: databaseUserAttributes.username,
      displayName: databaseUserAttributes.displayName,
      avatarUrl: databaseUserAttributes.avatarUrl,
      googleId: databaseUserAttributes.googleId,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  googleId: string | null;
}

export const google = new Google(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/google`,
);

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    // ambil cookie store async
    const cookieStore = await cookies(); // <--- harus await
    const sessionCookie = cookieStore.get(lucia.sessionCookieName); // sudah bisa dipakai
    const sessionId = sessionCookie?.value ?? null;

    if (!sessionId) return { user: null, session: null };

    const result = await lucia.validateSession(sessionId);

    try {
      if (result.session && result.session.fresh) {
        const newCookie = lucia.createSessionCookie(result.session.id);
        cookieStore.set(newCookie.name, newCookie.value, newCookie.attributes);
      } else if (!result.session) {
        const blankCookie = lucia.createBlankSessionCookie();
        cookieStore.set(
          blankCookie.name,
          blankCookie.value,
          blankCookie.attributes,
        );
      }
    } catch {}

    return result;
  },
);
