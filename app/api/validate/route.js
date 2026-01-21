import { createPool } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const body = await request.json();
  const { userId, qrCode, answer } = body;
  const pool = createPool({ connectionString: process.env.POSTGRES_URL });

  try {
    // 1. Find the Activity associated with the QR code
    const { rows: activities } = await pool.sql`SELECT * FROM activities WHERE code = ${qrCode}`;
    
    if (activities.length === 0) {
      return NextResponse.json({ success: false, message: 'Code QR Inconnu ❌' });
    }

    const activity = activities[0];

    // 2. Check if already scanned (Anti-Cheat)
    const { rows: history } = await pool.sql`
      SELECT * FROM validations WHERE user_id = ${userId} AND activity_code = ${qrCode}
    `;

    if (history.length > 0) {
      return NextResponse.json({ success: false, message: 'Déjà validé ! ⚠️' });
    }

    // 3. If the user hasn't sent an answer yet, send them the question
    if (!answer) {
      return NextResponse.json({ 
        success: true, 
        step: 'question', 
        question: activity.question,
        activityName: activity.name 
      });
    }

    // 4. Verify the Answer (Case insensitive)
    if (answer.trim().toLowerCase() !== activity.correct_answer.toLowerCase()) {
      return NextResponse.json({ success: false, message: 'Mauvaise réponse ! ❌' });
    }

    // 5. SUCCESS! Save to database
    await pool.sql`
      INSERT INTO validations (user_id, activity_code) VALUES (${userId}, ${qrCode})
    `;

    return NextResponse.json({ success: true, step: 'done', message: 'Validé avec succès ! ✅' });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Erreur serveur' }, { status: 500 });
  }
}