import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });

  // We handle both 'userId' (from your code) or 'email' just in case
  const userId = body.userId;
  const email = body.email;

  try {
    let userEmail = email;

    // 1. If we only got an ID, we need to find the email first
    if (!userEmail && userId) {
      const userRes = await pool.sql`SELECT email FROM users_app WHERE id = ${userId}`;
      if (userRes.rows.length > 0) {
        userEmail = userRes.rows[0].email;
      }
    }

    if (!userEmail) {
      return NextResponse.json({ counts: { obligatory: 0 } });
    }

    // 2. Count the scans for this email
    const scanCount = await pool.sql`SELECT COUNT(*) FROM scans_app WHERE user_email = ${userEmail}`;
    const count = parseInt(scanCount.rows[0].count);

    return NextResponse.json({ 
      counts: { obligatory: count } 
    });

  } catch (error) {
    console.error("STATS ERROR:", error);
    return NextResponse.json({ counts: { obligatory: 0 } }, { status: 500 });
  }
}