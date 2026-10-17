import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, country } = (await req.json()) || {};

    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanPassword = typeof password === "string" ? password : "";
    const cleanCountry = typeof country === "string" ? country.trim() : "Not specified";

    if (cleanName.length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your full name (minimum 2 characters)." },
        { status: 400 }
      );
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection("users");

    const existingUser = await usersCollection.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email address already exists. Please sign in."
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(cleanPassword, 12);

    const result = await usersCollection.insertOne({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      country: cleanCountry,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        userId: result.insertedId.toString()
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register account.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
