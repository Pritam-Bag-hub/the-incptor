import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    if (otp !== "0000") {
      return NextResponse.json({ error: "Demo: Please enter '0000' as the OTP." }, { status: 400 });
    }

    const targetPhone = phone.trim();

    // Find the user. We allow input like "9999999991", "+919999999991", or "9999999991"
    const user = await db.user.findFirst({
      where: {
        OR: [
          { phone: targetPhone },
          { phone: `+91${targetPhone}` },
          { phone: `+${targetPhone}` },
          { phone: targetPhone.startsWith("+91") ? targetPhone : `+91${targetPhone.replace(/^91/, "")}` }
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Phone number not registered in the system." }, { status: 401 });
    }

    // Generate secure random session token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration

    // Store session in database
    await db.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
