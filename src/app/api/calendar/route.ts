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

  try {
    const data = await prisma.userData.findUnique({ where: { userId } });

    return NextResponse.json({
      events: toArray(data?.events),
    });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerAuthSession();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payload = {
      events: toArray(body?.events),
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
        events: payload.events,
        settings: {},
      },
    });

    return NextResponse.json({
      events: toArray(data.events),
    });
  } catch (error) {
    console.error("/api/calendar PUT error", error);
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }
}
