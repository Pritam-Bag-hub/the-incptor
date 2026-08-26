import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (token) {
      // Delete session from database
      await db.session.deleteMany({
        where: { token },
      });
    }

    // Delete session cookie
    cookieStore.delete("session_token");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Logout API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
