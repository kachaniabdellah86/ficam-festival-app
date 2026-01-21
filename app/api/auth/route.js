import { NextResponse } from 'next/server';

// 💽 FAKE DATABASE
let users = [
  { 
    email: 'admin@test.com', 
    password: 'password123', 
    name: 'Super Admin', 
    xp: 9999, 
    level: 99, 
    badges: [1, 2, 3, 4, 6] 
  },
  { 
    email: 'student@test.com', 
    password: '123', 
    name: 'Étudiant Test', 
    xp: 150, 
    level: 2, 
    badges: [1, 2] 
  }
];

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    // 1️⃣ LOGIN
    if (action === 'login') {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const { password, ...userWithoutPass } = user; 
        return NextResponse.json({ success: true, user: userWithoutPass });
      } else {
        return NextResponse.json({ success: false, message: "Email incorrect." }, { status: 401 });
      }
    }
    // ... inside existing POST function ...

    // 4️⃣ UPDATE PROGRESS (Sync user activity)
    if (action === 'update_progress') {
        const { email, xpToAdd, badgeId } = body;
        
        // Find the user in our database
        const targetUser = users.find(u => u.email === email);
        
        if (targetUser) {
            // Add the XP
            targetUser.xp = (targetUser.xp || 0) + xpToAdd;
            
            // Add Badge if they don't have it
            if (!targetUser.badges) targetUser.badges = [];
            if (!targetUser.badges.includes(badgeId)) {
                targetUser.badges.push(badgeId);
            }

            return NextResponse.json({ success: true, newXp: targetUser.xp });
        }
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // ... end of function

    // 2️⃣ REGISTER
    if (action === 'register') {
      if (users.find(u => u.email === email)) {
        return NextResponse.json({ success: false, message: "Email déjà pris." }, { status: 400 });
      }
      const newUser = { email, password, name, xp: 0, level: 1, badges: [] };
      users.push(newUser);
      const { password: p, ...userWithoutPass } = newUser;
      return NextResponse.json({ success: true, user: userWithoutPass });
    }

    // 3️⃣ ADMIN: LIST USERS (New!)
    if (action === 'list_users') {
        // In a real app, we would verify the requester is an admin here!
        // For now, we just return the list minus passwords.
        const safeUsers = users.map(({ password, ...u }) => u);
        return NextResponse.json({ success: true, users: safeUsers });
    }

    return NextResponse.json({ success: false, message: "Action inconnue" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Erreur serveur" }, { status: 500 });
  }
}