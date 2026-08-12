import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signUpSchema } from "@/lib/validation/auth";
import {getUsersCollection, ensureUserIndexes} from "@/lib/users";

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

    // Validate input with Zod
    const result = signUpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid signup data",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

const { name, email, password } = result.data;

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

    
    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 12);

    const now = new Date();

    const resultInsert = await users.insertOne({
      name,
      email,
      password: hashedPassword,
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