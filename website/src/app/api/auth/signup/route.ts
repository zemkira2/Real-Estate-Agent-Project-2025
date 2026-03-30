import { NextResponse } from "next/server";
import { createUser, createToken, getTokenCookieOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Please fill in all fields" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name);
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
