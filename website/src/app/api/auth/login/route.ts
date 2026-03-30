import { NextResponse } from "next/server";
import { verifyCredentials, createToken, getTokenCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter your email and password" },
        { status: 400 }
      );
    }

    const user = await verifyCredentials(email, password);
    const token = await createToken(user);

    const response = NextResponse.json({ user });
    response.cookies.set(getTokenCookieOptions(token));
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
