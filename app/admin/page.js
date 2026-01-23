'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react'; // 👈 New: For generating QRs
import { Shield, Users, Trophy, Activity, LogOut, LayoutGrid, Menu, Plus, Trash2, QrCode, Download, Save } from 'lucide-react';
import { createClient } from '@supabase/supabase-js'; // Direct Supabase for Steps

// Initialize Supabase (Ensure these env vars are set)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('users'); // 👈 New: 'users' or 'steps'
  
  // Data States
  const [allUsers, setAllUsers] = useState([]);
  const [steps, setSteps] = useState([]); // 👈 New: Steps list
  const [newStep, setNewStep] = useState({ code: '', label: '', description: '' });
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
    
    // Initial Fetch
    fetchUsers();
    fetchSteps();

    // Auto-Refresh
    const interval = setInterval(() => {
      fetchUsers();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  // 1. FETCH USERS
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

  // 2. FETCH STEPS (From DB)
  const fetchSteps = async () => {
    const { data } = await supabase.from('steps').select('*').order('created_at', { ascending: true });
    if (data) setSteps(data);
  };

  // 3. ADD STEP
  const handleAddStep = async () => {
    if (!newStep.code || !newStep.label) return alert("Code et Label requis !");
    const { error } = await supabase.from('steps').insert([newStep]);
    if (error) alert(error.message);
    else {
        setNewStep({ code: '', label: '', description: '' });
        fetchSteps();
    }
  };

  // 4. DELETE STEP
  const handleDeleteStep = async (id) => {
    if(!confirm("Supprimer cette étape ?")) return;
    await supabase.from('steps').delete().match({ id });
    fetchSteps();
  };

  // 5. EXPORT TO CSV (PDF Requirement)
  const downloadExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Nom,Email,XP,Role,Badges Validés\n"
        + allUsers.map(u => `${u.name},${u.email},${u.xp || 0},${u.role},"${(u.badges || []).join(' | ')}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ficam_etudiants.csv");
    document.body.appendChild(link);
    link.click();
  };

  const getName = (email) => email ? email.split('@')[0] : 'Inconnu';

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white font-sans flex flex-col md:flex-row">
      
      {/* 🔵 SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#11111a] border-b md:border-r border-white/5 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10">
           <div className="bg-blue-600/20 p-2 rounded-lg"><Shield className="text-blue-500" size={24} /></div>
           <div><div className="font-bold text-lg">Admin OS</div><div className="text-[10px] text-blue-500/80 font-mono">v2.1 PRO</div></div>
        </div>

        <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          <NavButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Utilisateurs" />
          <NavButton active={activeTab === 'steps'} onClick={() => setActiveTab('steps')} icon={QrCode} label="Étapes & QR" />
          
          <div onClick={() => router.push('/dashboard')} className="md:mt-auto border-t md:border-white/10 md:pt-4 text-slate-400 p-3 rounded-lg flex items-center gap-3 font-medium hover:text-purple-400 cursor-pointer transition-colors">
            <LayoutGrid size={18} /> <span>Retour au Jeu</span>
          </div>
        </nav>
      </aside>

      {/* 🔵 MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-1">{activeTab === 'users' ? 'Gestion Étudiants' : 'Gestion du Parcours'}</h1>
            <p className="text-slate-400 text-sm">Panneau d'administration sécurisé.</p>
          </div>
          {activeTab === 'users' && (
              <button onClick={downloadExcel} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all">
                  <Download size={18} /> Exporter Excel
              </button>
          )}
        </header>

        {/* 📊 STATS (Always visible) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <StatCard title="Inscrits" value={stats.totalUsers} icon={Users} color="text-blue-400" />
            <StatCard title="Étapes Totales" value={steps.length} icon={QrCode} color="text-purple-400" />
            <StatCard title="Actifs" value={stats.activeNow} icon={Activity} color="text-green-400" />
        </div>

        {/* 🟡 TAB 1: USERS LIST */}
        {activeTab === 'users' && (
            <div className="bg-[#11111a] border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Users size={18} className="text-blue-500"/> Liste des Étudiants</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-white/5 text-slate-400 text-sm border-b border-white/5">
                                <th className="p-4 font-medium">Nom</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Progression</th>
                                <th className="p-4 font-medium">Badges</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {allUsers.map((u, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold capitalize">{getName(u.email)}</td>
                                    <td className="p-4 text-slate-400">{u.email}</td>
                                    <td className="p-4"><span className="text-yellow-400 font-bold">{u.xp || 0} XP</span></td>
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            {(u.badges || []).map((b, idx) => (
                                                <span key={idx} className="bg-purple-500/20 text-purple-300 text-[10px] px-2 py-1 rounded">{b}</span>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* 🟡 TAB 2: STEPS & QR CODES (PDF Requirement) */}
        {activeTab === 'steps' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. Add New Step Form */}
                <div className="lg:col-span-1 h-fit bg-[#11111a] border border-white/5 rounded-2xl p-6 sticky top-6">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Plus className="text-green-500"/> Ajouter une étape</h3>
                    <div className="space-y-4">
                        <Input label="Titre (Label)" placeholder="Ex: Atelier 3D" value={newStep.label} onChange={e => setNewStep({...newStep, label: e.target.value})} />
                        <Input label="Description" placeholder="Ex: Salle 104" value={newStep.description} onChange={e => setNewStep({...newStep, description: e.target.value})} />
                        <Input label="Code QR (Unique)" placeholder="Ex: FICAM-01" value={newStep.code} onChange={e => setNewStep({...newStep, code: e.target.value})} />
                        <button onClick={handleAddStep} className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all">Créer l'étape</button>
                    </div>
                </div>

                {/* 2. List of Steps with QR */}
                <div className="lg:col-span-2 space-y-4">
                     {steps.map(step => (
                        <div key={step.id} className="bg-[#11111a] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                            {/* QR CODE GENERATOR */}
                            <div className="bg-white p-3 rounded-xl shadow-lg">
                                <QRCodeSVG value={step.code} size={100} />
                            </div>
                            
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-bold text-white">{step.label}</h3>
                                <p className="text-slate-400 text-sm mb-2">{step.description}</p>
                                <div className="inline-block bg-white/10 px-3 py-1 rounded text-xs font-mono text-purple-300">
                                    Code: {step.code}
                                </div>
                            </div>

                            <button onClick={() => handleDeleteStep(step.id)} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                                <Trash2 size={20} />
                            </button>
                        </div>
                     ))}
                </div>
            </div>
        )}

      </main>
    </div>
  );
}

// ✨ Helper Components
function NavButton({ active, onClick, icon: Icon, label }) {
    return (
        <button onClick={onClick} className={`p-3 rounded-lg flex items-center gap-3 font-medium transition-all ${active ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <Icon size={18} /> <span>{label}</span>
        </button>
    )
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

function Input({ label, value, onChange, placeholder }) {
    return (
        <div>
            <label className="text-xs text-slate-500 uppercase font-bold ml-1 mb-1 block">{label}</label>
            <input className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:border-blue-500 outline-none transition-colors" placeholder={placeholder} value={value} onChange={onChange} />
        </div>
    )
}