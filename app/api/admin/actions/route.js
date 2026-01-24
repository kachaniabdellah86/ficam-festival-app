import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// ⚠️ This uses the SERVICE ROLE KEY (The "Master Key")
// It bypasses all security rules so the Admin can do anything.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, userId, newPassword } = body;

    // 1. CHANGE PASSWORD (GOD MODE)
    if (action === 'change_password') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId, 
        { password: newPassword }
      );
      if (error) throw error;
      return NextResponse.json({ success: true, message: "Mot de passe mis à jour !" });
    }

    // 2. DELETE USER (GOD MODE)
    if (action === 'delete_user') {
      // Delete from Auth System
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) throw authError;

      // Delete from Database Table
      const { error: dbError } = await supabaseAdmin.from('users').delete().eq('id', userId);
      if (dbError) throw dbError;

      return NextResponse.json({ success: true, message: "Utilisateur supprimé définitivement." });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });

  } catch (error) {
    console.error("ADMIN ACTION ERROR:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}