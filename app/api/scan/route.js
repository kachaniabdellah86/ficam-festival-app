import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { code } = await request.json();

    // 1. Log what we received (helps with debugging)
    console.log("Scanned code:", code);

    // 2. define your valid tickets here (or connect to Google Sheets later)
    const validTickets = [
      { id: "TICKET-001", name: "Abdellah K.", type: "VIP" },
      { id: "TICKET-002", name: "Guest User", type: "Standard" },
      { id: "12345", name: "Test Ticket", type: "Press" }
    ];

    // 3. Check if the scanned code matches a ticket
    const ticket = validTickets.find((t) => t.id === code);

    if (ticket) {
      return NextResponse.json({ success: true, ticket });
    } else {
      return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
    }

  } catch (error) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}