'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Trophy, Activity, Search, LogOut, CheckCircle, LayoutGrid } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalXP: 0, activeNow: 0 });

  useEffect(() => {
    // 1. Security Check: Are you the Admin?
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
      return;
    }
    
    const user = JSON.parse(stored);
    
    // 🔓 Allow access if role is admin OR if it's the specific test email
    // (We check 'role' now because Supabase has roles!)
    if (user.role !== 'admin' && user.email !== 'admin@test.com') {
      alert("Accès refusé: Vous n'êtes pas administrateur.");
      router.push('/dashboard'); 
      return;
    }
    
    setAdmin(user);
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list_users' }),
      });
      const data = await res.json();
      if (data.success) {
        setAllUsers(data.users);
        
        // Calculate Stats
        const totalXP = data.users.reduce((acc, curr) => acc + (curr.xp || 0), 0);
        setStats({
            totalUsers: data.users.length,
            totalXP: totalXP,
            activeNow: 1 // Showing 1 active (you!)
        });
      }
    } catch (error) {
      console.error("Failed to fetch users");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  // 🛠️ Helpers to handle missing data from Supabase
  const getName = (email) => email ? email.split('@')[0] : 'Inconnu'; // "alex@test.com" -> "alex"
  const getLevel = (xp) => Math.floor((xp || 0) / 100) + 1; // Calculate level from XP

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white font-sans flex">
      
      {/* 🔵 ADMIN SIDEBAR */}
      <aside className="w-64 bg-[#11111a] border-r border-white/5 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-blue-600/20 p-2 rounded-lg">
            <Shield className="text-blue-500" size={24} />
          </div>
          <div>
            <div className="font-bold text-lg tracking-tight">Admin OS</div>
            <div className="text-[10px] text-blue-500/80 font-mono tracking-widest">v2.0 LIVE</div>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          <div className="bg-blue-600/10 text-blue-400 p-3 rounded-lg flex items-center gap-3 font-medium border border-blue-500/20">
            <Users size={18} /> Gestion Utilisateurs
          </div>
          <div className="text-slate-500 p-3 rounded-lg flex items-center gap-3 font-medium hover:bg-white/5 hover:text-white cursor-pointer transition-colors">
            <Activity size={18} /> Logs Système
          </div>

          <div 
            onClick={() => router.push('/dashboard')} 
            className="mt-6 border-t border-white/10 pt-4 text-slate-400 p-3 rounded-lg flex items-center gap-3 font-medium hover:bg-purple-500/10 hover:text-purple-400 cursor-pointer transition-colors"
          >
            <LayoutGrid size={18} /> 
            <span>Retour au Jeu</span>
          </div>
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl text-slate-500 hover:bg-red-900/20 hover:text-red-400 transition-all mt-auto">
          <LogOut size={18} /> <span className="font-medium">Déconnexion</span>
        </button>
      </aside>

      {/* 🔵 MAIN PANEL */}
      <main className="flex-1 p-10 overflow-y-auto">
        
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">Vue d'ensemble</h1>
            <p className="text-slate-400">Base de données Supabase connectée.</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-[#1a1a24] border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-sm text-slate-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Système en ligne
             </div>
          </div>
        </header>

        {/* STATS ROW */}
        <div className="grid grid-cols-3 gap-6 mb-10">
            <StatCard title="Utilisateurs Inscrits" value={stats.totalUsers} icon={Users} color="text-blue-400" />
            <StatCard title="XP Total Distribué" value={stats.totalXP} icon={Trophy} color="text-yellow-400" />
            <StatCard title="Actifs (Live)" value={stats.activeNow} icon={Activity} color="text-green-400" />
        </div>

        {/* USERS TABLE */}
        <div className="bg-[#11111a] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Users size={18} className="text-blue-500"/> Liste des Étudiants
                </h3>
                <button onClick={fetchUsers} className="text-sm bg-white/5 hover:bg-white/10 px-3 py-1 rounded transition-colors text-slate-400">
                    Actualiser
                </button>
            </div>
            
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-white/5 text-slate-400 text-sm border-b border-white/5">
                        <th className="p-4 font-medium">Utilisateur</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Rôle</th>
                        <th className="p-4 font-medium">XP</th>
                        <th className="p-4 font-medium">Badges</th>
                        <th className="p-4 font-medium">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                    {allUsers.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-500">Aucun utilisateur trouvé.</td></tr>
                    ) : (
                        allUsers.map((u, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 font-medium text-white flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center font-bold text-xs border border-white/10 uppercase">
                                        {u.email ? u.email.charAt(0) : '?'}
                                    </div>
                                    <span className="capitalize">{getName(u.email)}</span>
                                </td>
                                <td className="p-4 text-slate-400 font-mono">{u.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                      {u.role || 'student'}
                                    </span>
                                </td>
                                <td className="p-4 font-bold text-yellow-400">{u.xp || 0} XP</td>
                                <td className="p-4">
                                    <span className="bg-white/5 text-slate-400 border border-white/10 px-2 py-1 rounded text-xs">
                                        {u.badges ? (typeof u.badges === 'string' ? JSON.parse(u.badges).length : u.badges.length) : 0} 🏆
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-green-400 text-xs bg-green-500/10 w-fit px-2 py-1 rounded border border-green-500/20">
                                        <CheckCircle size={12} /> Actif
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-[#11111a] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}>
                <Icon size={64} />
            </div>
            <div className="relative z-10">
                <div className="text-slate-400 font-medium text-sm mb-2">{title}</div>
                <div className={`text-4xl font-bold ${color}`}>{value}</div>
            </div>
        </div>
    )
}