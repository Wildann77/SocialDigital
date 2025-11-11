import { google } from "@/auth";
import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  const url = await google.createAuthorizationURL(
    state,
    codeVerifier,
    ["openid", "profile", "email"], // scope array
    {
      access_type: "offline",
      prompt: "consent",
    },
  );

  console.log("🔗 Redirect URL Google:", url.toString());

  const cookieStore = await cookies();

  cookieStore.set("state", state, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  });

  cookieStore.set("code_verifier", codeVerifier, {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,    
    sameSite: "lax",
  });

  return Response.redirect(url);
}
