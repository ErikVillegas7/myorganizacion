import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureUser } from "@/lib/api-helpers";

const toObject = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : null;

export async function GET() {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await prisma.userData.findUnique({ where: { userId } });

  return NextResponse.json({
    settings: toObject(data?.settings),
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
    settings: toObject(body?.settings) ?? {},
  };

  await ensureUser(userId);
  const data = await prisma.userData.upsert({
    where: { userId },
    update: payload,
    create: {
      userId,
      subjects: [],
      units: [],
      notes: [],
      folders: [],
      habits: [],
      events: [],
      settings: payload.settings,
    },
  });

  return NextResponse.json({
    settings: toObject(data.settings) ?? {},
  });
}
