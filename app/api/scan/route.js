import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { email, activity } = await request.json();
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });

  try {
    // 1. Create table if it doesn't exist
    await pool.sql`CREATE TABLE IF NOT EXISTS scans (
      id SERIAL PRIMARY KEY,
      user_email VARCHAR(255),
      activity_name VARCHAR(255),
      scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;

    // 2. Check for duplicate scans
    const check = await pool.sql`SELECT * FROM scans WHERE user_email=${email} AND activity_name=${activity}`;
    if (check.rows.length > 0) {
        return NextResponse.json({ success: false, message: 'Activity already scanned!' });
    }

    // 3. Save the scan
    await pool.sql`INSERT INTO scans (user_email, activity_name) VALUES (${email}, ${activity})`;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SCAN ERROR:", error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}