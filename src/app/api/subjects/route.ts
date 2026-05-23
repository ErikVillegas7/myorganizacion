import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/api-helpers";

const toArray = (value: unknown) => (Array.isArray(value) ? value : []);

export async function GET() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.userData.findUnique({ where: { userId } });

  return NextResponse.json({
    subjects: toArray(data?.subjects),
    units: toArray(data?.units),
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
    subjects: toArray(body?.subjects),
    units: toArray(body?.units),
  };

  await ensureUser(userId);
  const data = await prisma.userData.upsert({
    where: { userId },
    update: payload,
    create: {
      userId,
      subjects: payload.subjects,
      units: payload.units,
      notes: [],
      folders: [],
      habits: [],
      events: [],
      settings: {},
    },
  });

  return NextResponse.json({
    subjects: toArray(data.subjects),
    units: toArray(data.units),
  });
}
