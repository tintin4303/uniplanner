import { NextResponse } from "next/server";
import { generateAiAction } from "@/app/actions";

export async function POST(req: Request) {
  try {
      const { prompt, currentSubjects } = await req.json();
      const result = await generateAiAction(prompt, currentSubjects);
      
      if (result.success) {
          return NextResponse.json(result);
      } else {
          return NextResponse.json({ error: result.error || "AI Failed" }, { status: 400 });
      }
  } catch (error) {
      return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}