import { NextResponse } from 'next/server';
import { supabase } from '../../lib/supabaseClient';

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, email, password, name, xpToAdd, badgeId } = body;

    // 1️⃣ LOGIN
    if (action === 'login') {
      // Find user in Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password) // Note: In production, passwords should be hashed!
        .single();

      if (error || !user) {
        return NextResponse.json({ success: false, message: "Email ou mot de passe incorrect." }, { status: 401 });
      }

      // Hide password before sending back
      const { password: _, ...userWithoutPass } = user;
      return NextResponse.json({ success: true, user: userWithoutPass });
    }

    // 2️⃣ REGISTER
    // ... inside the register block in app/api/auth/route.js

// Create new user in Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          password, 
          name: name, // 👈 ADD THIS LINE
          role: 'student',
          xp: 0, 
          badges: [] 
        }
      ])
  .select()
  .single();  
    if (action === 'register') {
      // Check if email exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        return NextResponse.json({ success: false, message: "Cet email est déjà pris." }, { status: 400 });
      }

      // Create new user in Supabase
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          { 
            email, 
            password, 
            role: 'student', // Default role
            xp: 0, 
            badges: [] // Start with empty badges
          }
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase Error:", error);
        return NextResponse.json({ success: false, message: "Erreur lors de la création." });
      }

      return NextResponse.json({ success: true, user: newUser });
    }

    // 3️⃣ ADMIN: LIST USERS
    if (action === 'list_users') {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, email, role, xp, badges') // We don't select password
        .order('xp', { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, users: [] });
      }
      
      return NextResponse.json({ success: true, users: users });
    }

    // 4️⃣ UPDATE PROGRESS (For Scanner)
    if (action === 'update_progress') {
      // First, get the current user data to see their current badges
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('xp, badges')
        .eq('email', email)
        .single();

      if (fetchError || !currentUser) {
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
      }

      // Calculate new values
      const newXp = (currentUser.xp || 0) + xpToAdd;
      
      // Handle Badges safely
      let currentBadges = currentUser.badges || [];
      // If badges is just a string (sometimes happens), parse it
      if (typeof currentBadges === 'string') currentBadges = JSON.parse(currentBadges);
      
      if (badgeId && !currentBadges.includes(badgeId)) {
        currentBadges.push(badgeId);
      }

      // Update Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ xp: newXp, badges: currentBadges })
        .eq('email', email);

      if (updateError) {
        return NextResponse.json({ success: false, message: "Failed to update" });
      }

      return NextResponse.json({ success: true, newXp: newXp });
    }

    return NextResponse.json({ success: false, message: "Action inconnue" }, { status: 400 });

  } catch (error) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}