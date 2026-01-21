import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });

  try {
    // 1. Get ALL Users (To count how many students you have)
    // Note: If your table is named 'users', change 'users_app' to 'users' below.
    const users = await pool.sql`SELECT * FROM users_app ORDER BY id ASC`;
    
    // 2. Get ALL Scans (To see the live feed of activity)
    const scans = await pool.sql`SELECT * FROM scans_app ORDER BY scanned_at DESC`;

    return NextResponse.json({ 
      success: true, 
      users: users.rows, 
      scans: scans.rows 
    });
  } catch (error) {
    console.error("ADMIN ERROR:", error);
    // Even if users table fails, we try to return scans so you see something
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}