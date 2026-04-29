import { NextResponse } from "next/server";
import { deleteItem } from "@/lib/wardrobeStore";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  await deleteItem(params.id);
  return NextResponse.json({ ok: true });
}