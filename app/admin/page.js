'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, Trophy, Activity, LayoutGrid, Menu, QrCode, Trash2, Plus } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('steps'); // Default to QR view like your screenshot
  const [allUsers, setAllUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalXP: 0, activeNow: 0 });

  // --- NEW: State for Steps (The missing part) ---
  const [steps, setSteps] = useState([
    { id: 1, label: 'Bienvenue !', desc: "Scanner l'entrée principale", code: 'FICAM-WELCOME' },
    { id: 2, label: 'Atelier 3D', desc: 'Participer au workshop', code: 'FICAM-WORKSHOP' }
  ]);
  const [newStep, setNewStep] = useState({ label: '', desc: '', code: '' });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    
    const user = JSON.parse(stored);
    if (user.role !== 'admin' && user.email !== 'admin@test.com') {
      router.push('/dashboard'); 
      return;
    }
    setAdmin(user);
    fetchUsers();
    const interval = setInterval(fetchUsers, 5000); 
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

  const handleAddStep = () => {
    if (!newStep.label || !newStep.code) return;
    setSteps([...steps, { ...newStep, id: Date.now() }]);
    setNewStep({ label: '', desc: '', code: '' });
  };

  const handleDeleteStep = (id) => {
    setSteps(steps.filter(s => s.id !== id));
  };

  const getName = (email) => email ? email.split('@')[0] : 'Inconnu';

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white font-sans flex flex-col md:flex-row">
      
      {/* 🔵 ADMIN SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#11111a] border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-4 md:p-6">
        <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600/20 p-2 rounded-lg">
                <Shield className="text-blue-500" size={24} />
            </div>
            <div>
                <div className="font-bold text-lg">Admin OS</div>
                <div className="text-[10px] text-blue-500/80 font-mono tracking-widest">v2.1 PRO</div>
            </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex md:flex-col gap-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`p-3 rounded-lg flex items-center gap-3 font-medium transition-colors w-full text-left ${activeTab === 'users' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <Users size={18} /> Utilisateurs
          </button>

          <button 
            onClick={() => setActiveTab('steps')}
            className={`p-3 rounded-lg flex items-center gap-3 font-medium transition-colors w-full text-left ${activeTab === 'steps' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <QrCode size={18} /> Étapes & QR
          </button>
          
          <div onClick={() => router.push('/dashboard')} className="md:mt-auto border-t md:border-white/10 md:pt-4 text-slate-400 p-3 rounded-lg flex items-center gap-3 font-medium hover:text-purple-400 cursor-pointer">
            <LayoutGrid size={18} /> Retour au Jeu
          </div>
        </nav>
      </aside>

      {/* 🔵 MAIN PANEL */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        
        {/* === VIEW 1: USERS LIST === */}
        {activeTab === 'users' && (
            <>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-1">Utilisateurs</h1>
                    <p className="text-slate-400 text-sm">Gestion des étudiants inscrits.</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Inscrits" value={stats.totalUsers} icon={Users} color="text-blue-400" />
                    <StatCard title="XP Total" value={stats.totalXP} icon={Trophy} color="text-yellow-400" />
                    <StatCard title="Actifs" value={stats.activeNow} icon={Activity} color="text-green-400" />
                </div>

                <div className="bg-[#11111a] border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-slate-400 text-sm">
                            <tr><th className="p-4">Utilisateur</th><th className="p-4">Rôle</th><th className="p-4">XP</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {allUsers.map((u, i) => (
                                <tr key={i} className="hover:bg-white/5">
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">{u.email?.charAt(0)}</div>
                                        {getName(u.email)}
                                    </td>
                                    <td className="p-4"><span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">{u.role}</span></td>
                                    <td className="p-4 font-bold text-yellow-400">{u.xp} XP</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </>
        )}

        {/* === VIEW 2: STEPS & QR (RESTORED) === */}
        {activeTab === 'steps' && (
            <>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-1">Gestion du Parcours</h1>
                    <p className="text-slate-400 text-sm">Créez des QR codes pour chaque étape.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT: Add Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#11111a] p-6 rounded-2xl border border-white/5">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Ajouter une étape</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Titre (Label)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Atelier 3D"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white mt-1"
                                        value={newStep.label}
                                        onChange={(e) => setNewStep({...newStep, label: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Description</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Salle 104"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white mt-1"
                                        value={newStep.desc}
                                        onChange={(e) => setNewStep({...newStep, desc: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Code QR (Unique)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: FICAM-01"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white mt-1"
                                        value={newStep.code}
                                        onChange={(e) => setNewStep({...newStep, code: e.target.value})}
                                    />
                                </div>
                                <button 
                                    onClick={handleAddStep}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all"
                                >
                                    Créer l'étape
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: List of QR Codes */}
                    <div className="lg:col-span-2 grid gap-4">
                        {steps.map((step) => (
                            <div key={step.id} className="bg-[#11111a] p-4 rounded-2xl border border-white/5 flex items-center gap-6 group hover:border-white/10 transition-all">
                                <div className="bg-white p-2 rounded-lg shrink-0">
                                    <QRCodeSVG value={step.code} size={80} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg">{step.label}</h3>
                                    <p className="text-slate-400 text-sm mb-2">{step.desc}</p>
                                    <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded font-mono border border-purple-500/20">
                                        Code: {step.code}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleDeleteStep(step.id)}
                                    className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        )}

      </main>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
    return (
        <div className="bg-[#11111a] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-4 opacity-10 ${color}`}><Icon size={64} /></div>
            <div className="relative z-10">
                <div className="text-slate-400 font-medium text-sm mb-2">{title}</div>
                <div className={`text-4xl font-bold ${color}`}>{value}</div>
            </div>
        </div>
    )
}