import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import Groq from "groq-sdk";

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { userId, prompt, currentSubjects } = await req.json();

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Check & Deduct Tokens
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.tokens < 5) {
        return NextResponse.json({ error: "Insufficient tokens" }, { status: 402 });
    }

    await prisma.user.update({ 
        where: { id: userId }, 
        data: { tokens: { decrement: 5 } } 
    });

    // 2. Prepare Context (Same logic as web)
    const context = currentSubjects.map((s: any) => ({
        name: s.name,
        credits: s.credits,
        schedule: s.classes.map((c: any) => `${c.day} ${c.start}-${c.end}`).join(", ")
    }));

    // 3. Call Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a Schedule Assistant. Analyze request based on CURRENT STATE: ${JSON.stringify(context)}. 
          Return JSON with actions: ADD, REMOVE, UPDATE, FILTER.` 
          // (Keep your full system prompt here from actions.ts for best results)
        },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
    
    return NextResponse.json({ 
        success: true, 
        result, 
        newBalance: user.tokens - 5 
    });

  } catch (error) {
    console.error("Mobile AI Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}