import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

const toArray = (value: unknown) => (Array.isArray(value) ? value : []);

export async function GET() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.userData.findUnique({ where: { userId } });

  return NextResponse.json({
    notes: toArray(data?.notes),
    folders: toArray(data?.folders),
  });
}

export async function PUT(request: Request) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const payload = {
    notes: toArray(body?.notes),
    folders: toArray(body?.folders),
  };

  const data = await prisma.userData.upsert({
    where: { userId },
    update: payload,
    create: {
      userId,
      subjects: [],
      units: [],
      notes: payload.notes,
      folders: payload.folders,
      habits: [],
      events: [],
      settings: {},
    },
  });

  return NextResponse.json({
    notes: toArray(data.notes),
    folders: toArray(data.folders),
  });
}
