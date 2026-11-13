import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();
    const expectedPin = process.env.ADMIN_PIN || "0000";

    if (pin === expectedPin) {
      return NextResponse.json({ success: true, authorized: true });
    } else {
      return NextResponse.json({ success: false, authorized: false, error: "Code PIN incorrect" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur de validation" }, { status: 500 });
  }
}
