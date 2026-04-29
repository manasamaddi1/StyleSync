import { NextResponse } from "next/server";
import { classifyClothingFake } from "@/lib/classifier";

export async function POST() {
  const prediction = classifyClothingFake();
  return NextResponse.json({ prediction });
}