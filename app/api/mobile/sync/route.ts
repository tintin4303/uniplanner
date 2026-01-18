import { NextResponse } from "next/server";
import { loadScheduleFromDB } from "@/app/actions"; 

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
      const data = await loadScheduleFromDB();
      return NextResponse.json({ data });
  } catch (error) {
      return NextResponse.json({ data: null });
  }
}

export async function POST(req: Request) {
  return NextResponse.json({ success: true });
}