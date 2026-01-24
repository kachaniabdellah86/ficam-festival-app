'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Trophy, Activity, Search, LogOut, CheckCircle, LayoutGrid, Menu } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalXP: 0, activeNow: 0 });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    
    const user = JSON.parse(stored);
    if (user.role !== 'admin' && user.email !== 'admin@test.com') {
      router.push('/dashboard'); 
      return;
    }
    setAdmin(user);
    
    // 1. Fetch immediately
    fetchUsers();

    // 2. ⚡ Set up Auto-Refresh (Every 5 seconds)
    const interval = setInterval(() => {
      fetchUsers();
    }, 5000); 

    // 3. Cleanup
    return () => clearInterval(interval);
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
        const totalXP = data.users.reduce((acc, curr) => acc + (curr.xp || 0), 0);
        setStats({ totalUsers: data.users.length, totalXP: totalXP, activeNow: 1 });
      }
    } catch (error) { console.error("Failed to fetch users"); }
  };

  const getName = (email) => email ? email.split('@')[0] : 'Inconnu';

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white font-sans flex flex-col md:flex-row">
      
      {/* 🔵 ADMIN SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#11111a] border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-4 md:p-6">
        
        <div className="flex items-center justify-between md:justify-start gap-3 mb-4 md:mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/20 p-2 rounded-lg">
                <Shield className="text-blue-500" size={24} />
            </div>
            <div>
                <div className="font-bold text-lg tracking-tight">Admin OS</div>
                <div className="text-[10px] text-blue-500/80 font-mono tracking-widest">v2.0 LIVE</div>
            </div>
          </div>
          <Menu className="text-slate-500 md:hidden" />
        </div>

        {/* Navigation */}
        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          <div className="bg-blue-600/10 text-blue-400 p-3 rounded-lg flex items-center gap-3 font-medium border border-blue-500/20 whitespace-nowrap">
            <Users size={18} /> <span className="hidden md:inline">Utilisateurs</span> <span className="md:hidden">Users</span>
          </div>
          
          {/* SIDEBAR BUTTON */}
          <div 
            onClick={() => router.push('/dashboard')} 
            className="md:mt-auto border-t md:border-white/10 md:pt-4 text-slate-400 p-3 rounded-lg flex items-center gap-3 font-medium hover:bg-purple-500/10 hover:text-purple-400 cursor-pointer transition-colors whitespace-nowrap"
          >
            <LayoutGrid size={18} /> 
            <span>Retour <span className="hidden md:inline">au Jeu</span></span>
          </div>
        </nav>
      </aside>

      {/* 🔵 MAIN PANEL */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Vue d'ensemble</h1>
            <p className="text-slate-400 text-sm">Base de données Supabase connectée.</p>
          </div>

          {/* 👇 NEW HEADER BUTTON (Big Purple) 👇 */}
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-bold shadow-lg shadow-purple-600/20"
          >
            <LayoutGrid size={18} /> Retour au Jeu
          </button>

        </header>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
            <StatCard title="Inscrits" value={stats.totalUsers} icon={Users} color="text-blue-400" />
            <StatCard title="XP Total" value={stats.totalXP} icon={Trophy} color="text-yellow-400" />
            <StatCard title="Actifs" value={stats.activeNow} icon={Activity} color="text-green-400" />
        </div>

        {/* USERS TABLE */}
        <div className="bg-[#11111a] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Users size={18} className="text-blue-500"/> <span className="hidden md:inline">Liste des Étudiants</span><span className="md:hidden">Étudiants</span>
                </h3>
                <button onClick={fetchUsers} className="text-sm bg-white/5 hover:bg-white/10 px-3 py-1 rounded transition-colors text-slate-400">
                    Actualiser
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="bg-white/5 text-slate-400 text-sm border-b border-white/5">
                            <th className="p-4 font-medium">Utilisateur</th>
                            <th className="p-4 font-medium">Rôle</th>
                            <th className="p-4 font-medium">XP</th>
                            <th className="p-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {allUsers.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-slate-500">Aucun utilisateur trouvé.</td></tr>
                        ) : (
                            allUsers.map((u, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-medium text-white flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center font-bold text-xs border border-white/10 uppercase shrink-0">
                                            {u.email ? u.email.charAt(0) : '?'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="capitalize">{getName(u.email)}</span>
                                            <span className="text-xs text-slate-500 font-mono">{u.email}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
                                        {u.role || 'student'}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-yellow-400">{u.xp || 0} XP</td>
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