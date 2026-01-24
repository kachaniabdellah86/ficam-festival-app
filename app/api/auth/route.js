import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, email, password, name, badgeId } = body;

    // 1️⃣ LOGIN
    if (action === 'login') {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password) // Note: Passwords should be hashed in production
        .single();

      if (error || !user) {
        return NextResponse.json({ success: false, message: "Email ou mot de passe incorrect." }, { status: 401 });
      }

      // Hide password before sending back
      const { password: _, ...userWithoutPass } = user;
      return NextResponse.json({ success: true, user: userWithoutPass });
    }

    // 2️⃣ REGISTER
    if (action === 'register') {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        return NextResponse.json({ success: false, message: "Cet email est déjà pris." }, { status: 400 });
      }

      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          { 
            email, 
            password, 
            name: name || 'Étudiant', // Use provided name or default
            role: 'student',
            xp: 0, 
            badges: [] 
          }
        ])
        .select()
        .single();

      if (error) {
        console.error("Register Error:", error);
        return NextResponse.json({ success: false, message: "Erreur lors de la création." });
      }

      return NextResponse.json({ success: true, user: newUser });
    }

    // 3️⃣ ADMIN: LIST USERS
    if (action === 'list_users') {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, role, xp, badges')
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, users: [] });
      }
      return NextResponse.json({ success: true, users: users });
    }

    // 4️⃣ UPDATE PROGRESS (Scanner)
    if (action === 'update_progress') {
      // Get current user data
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('badges')
        .eq('email', email)
        .single();

      if (fetchError || !currentUser) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
      }

      // Add badge if not already there
      let currentBadges = currentUser.badges || [];
      if (typeof currentBadges === 'string') currentBadges = JSON.parse(currentBadges); // Safety check
      
      if (badgeId && !currentBadges.includes(badgeId)) {
        currentBadges.push(badgeId);
      }

      // Save to DB
      const { error: updateError } = await supabase
        .from('users')
        .update({ badges: currentBadges })
        .eq('email', email);

      if (updateError) {
        return NextResponse.json({ success: false, message: "Failed to update" });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: "Action inconnue" }, { status: 400 });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}