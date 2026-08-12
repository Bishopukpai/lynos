import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { signUpSchema } from "@/lib/validation/auth";
import {
  getUsersCollection,
  ensureUserIndexes,
} from "@/lib/users";

export async function POST(request: Request) {
  try {
    // Safely parse incoming JSON body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or missing JSON payload",
        },
        { status: 400 }
      );
    }

    // Validate incoming data with Zod
    const result = signUpSchema.safeParse(body);

    if (!result.success) {
  console.error(
    "Signup validation errors:",
    result.error.flatten()
  );

  return NextResponse.json(
    {
      success: false,
      message: "Invalid signup data",
      errors: result.error.flatten().fieldErrors,
    },
    { status: 400 }
  );
}

    // Extract validated account data
    const { user, profile } = result.data;

    const {
      name,
      email,
      password,
    } = user;

    // Extract validated profile data
    const {
      country,
      timezone,
      language,
      stateRegion,
      role,
      useCases,
      companyName,
      teamSize,
    } = profile;

    // Ensure the unique email index exists
    await ensureUserIndexes();

    const users = await getUsersCollection();

    // Check whether the email already exists
    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists",
        },
        { status: 409 }
      );
    }

    // Hash password before storing it
    const hashedPassword = await bcrypt.hash(password, 12);

    const now = new Date();

    // Create user
    const resultInsert = await users.insertOne({
      name,
      email,
      password: hashedPassword,

      // Location / profile information
      country,
      timezone,
      language,
      stateRegion,

      // Workspace information
      role,
      useCases,
      companyName,
      teamSize,

      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        user: {
          id: resultInsert.insertedId.toString(),
          name,
          email,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    // Handle MongoDB duplicate-key errors
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists",
        },
        { status: 409 }
      );
    }

    console.error("Signup error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create account",
      },
      { status: 500 }
    );
  }
}