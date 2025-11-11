import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebaseAdmin";

async function getUserId(req: NextRequest) {
  const token = req.headers.get("authorization")?.split("Bearer ")[1];
  if (!token) throw new Error("Unauthorized");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

export async function GET(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    const todos = await prisma.todo.findMany({ where: { userId: uid } });
    return NextResponse.json(todos);
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await getUserId(req);
    const data = await req.json();
    const todo = await prisma.todo.create({
      data: { title: data.title, userId: uid },
    });
    return NextResponse.json(todo);
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
