import { google, lucia } from "@/auth";
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("state")?.value;
  const storedCodeVerifier = cookieStore.get("code_verifier")?.value;

  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    return new Response(null, { status: 400 });
  }

  try {
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    const googleUser = await kyInstance
      .get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokens.accessToken()}` },
      })
      .json<{ sub: string; email: string; name: string; picture: string }>();

    console.log("🔑 Tokens:", {
      accessToken: tokens.accessToken(),
      refreshToken: tokens.refreshToken, // cukup property
      idToken: tokens.idToken, // cukup property
    });   

    // Cari user
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.sub },
    });

    if (!user) {
      const userId = generateIdFromEntropySize(10);
      const username = slugify(googleUser.name) + "-" + userId.slice(0, 4);

      user = await prisma.user.create({
        data: {
          id: userId,
          username,
          displayName: googleUser.name,
          googleId: googleUser.sub,
          email: googleUser.email,
        },
      });

      // Jangan sampai error Stream nge-block login
      try {
        console.log("📡 Upsert user ke Stream...");
        await streamServerClient.upsertUser({
          id: userId,
          username,
          name: username,
        });
        console.log("✅ User berhasil sync ke Stream");
      } catch (err) {
        console.error("⚠️ Stream error:", err);
      }
    }

    // Buat session Lucia
    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);

    cookieStore.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });
  } catch (error) {
    console.error(error);
    if (error instanceof OAuth2RequestError) {
      return new Response(null, { status: 400 });
    }
    return new Response(null, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
