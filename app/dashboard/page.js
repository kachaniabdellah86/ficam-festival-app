'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { LayoutGrid, ScanLine, Trophy, UserCircle, LogOut, Flame, Clock, CalendarCheck, Lock, XCircle, CheckCircle2, Shield, MapPin } from 'lucide-react';

// 🗺️ DEFINITION DES QUÊTES (The Source of Truth)
const QUESTS = {
  'FICAM-WELCOME': { id: 'q1', xp: 50, badge: 2, label: "Bienvenue au Festival", desc: "Scanner le code à l'entrée principale", icon: MapPin },
  'FICAM-WORKSHOP': { id: 'q2', xp: 100, badge: 4, label: "Atelier Animation 3D", desc: "Participer au workshop créatif", icon: Palette },
  'FICAM-MOVIE': { id: 'q3', xp: 30, badge: 3, label: "Projection: Le Roi Lion", desc: "Assister à la séance de 14h", icon: Film },
  'FICAM-MASTER': { id: 'q4', xp: 200, badge: 6, label: "Rencontre Réalisateur", desc: "Q&A avec l'invité spécial", icon: Mic },
};

// Helper icons for the list above
import { Palette, Film, Mic } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle');
  const [lastScan, setLastScan] = useState(null);

  // 1. Load User on Startup
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/login');
    } else {
      setUser(JSON.parse(stored));
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // 🧠 PROCESS SCAN
  const processCode = async (code) => {
    const quest = QUESTS[code]; // Look up in our QUESTS list

    if (quest) {
        // 1. Check if already done (prevent double XP)
        if (user.badges?.includes(quest.badge)) {
             setScanStatus('error');
             setLastScan("Déjà validé !");
             setIsScanning(false);
             return;
        }

        // 2. Update LOCAL State
        const updatedUser = { ...user };
        updatedUser.xp = (updatedUser.xp || 0) + quest.xp;
        if (!updatedUser.badges) updatedUser.badges = [];
        updatedUser.badges.push(quest.badge);
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setScanStatus('success');
        setLastScan(quest.label);
        setIsScanning(false);

        // 3. 📡 SEND TO SERVER
        try {
            await fetch('/api/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_progress',
                    email: user.email,
                    xpToAdd: quest.xp,
                    badgeId: quest.badge
                }),
            });
        } catch (err) {
            console.error("Sync failed", err);
        }

    } else {
        setScanStatus('error');
        setLastScan("Code inconnu");
        setIsScanning(false);
    }
  };

  const handleScan = (result) => {
    if (result && result[0]) {
        processCode(result[0].rawValue);
    }
  };

  // 🧱 MOCK DATA for Badges
  const allBadges = [
    { id: 1, title: "Explorateur", desc: "Créer son compte", icon: "🚀", req: "auto" },
    { id: 2, title: "Premier Pas", desc: "Scanner le QR d'accueil", icon: "📸", req: 2 }, 
    { id: 3, title: "Cinéphile", desc: "Voir un film", icon: "🎬", req: 3 },
    { id: 4, title: "Artiste", desc: "Faire un Workshop", icon: "🎨", req: 4 },
    { id: 6, title: "Légende", desc: "Rencontrer un VIP", icon: "👑", req: 6 },
  ];

  if (!user) return null;

  // Calculate stats
  const completedCount = user.badges ? user.badges.length : 0;
  const totalQuests = Object.keys(QUESTS).length + 1; // +1 for account creation
  const progressPercent = Math.round((completedCount / totalQuests) * 100);

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-sans flex overflow-hidden">
      
      {/* 🟣 SIDEBAR */}
      <aside className="w-20 md:w-64 bg-black/20 backdrop-blur-md border-r border-white/5 flex flex-col p-4 z-50">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">F</div>
          <span className="font-bold text-xl hidden md:block tracking-tight">FICAM</span>
        </div>

        <nav className="space-y-2 flex-1">
          <NavItem icon={LayoutGrid} label="Dashboard" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          
          {/* 👇 NEW BUTTON: ACTIVITIES / SUIVI */}
          <NavItem icon={CalendarCheck} label="Activités" active={activeTab === 'activities'} onClick={() => setActiveTab('activities')} />
          
          <NavItem icon={ScanLine} label="Scanner" active={activeTab === 'scanner'} onClick={() => setActiveTab('scanner')} />
          <NavItem icon={Trophy} label="Succès" active={activeTab === 'trophies'} onClick={() => setActiveTab('trophies')} />
          
          {user?.email === 'admin@test.com' && (
            <div className="mt-8 pt-8 border-t border-white/10 animate-in fade-in">
                <p className="text-xs text-slate-500 font-mono mb-2 px-2 hidden md:block">ADMINISTRATION</p>
                <button 
                  onClick={() => router.push('/admin')}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-bold bg-blue-600/20 text-blue-400 border border-blue-500/50 hover:bg-blue-600 hover:text-white"
                >
                  <Shield size={20} />
                  <span className="hidden md:block">Admin Panel</span>
                </button>
            </div>
          )}
        </nav>

        <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all mt-auto">
          <LogOut size={20} /> <span className="hidden md:block">Déconnexion</span>
        </button>
      </aside>

      {/* 🟣 CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-black mb-1">Salut, {user.name} 👋</h1>
            <p className="text-slate-400 text-sm">Niveau {Math.floor((user.xp || 0) / 100) + 1}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 p-[2px]">
             <div className="w-full h-full rounded-full bg-[#0F0F1A] flex items-center justify-center">
               <UserCircle size={24} />
             </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard label="Points XP" value={user.xp || 0} icon={Flame} color="text-orange-400" bg="bg-orange-500/10" />
              <StatCard label="Badges" value={user.badges?.length || 0} icon={Trophy} color="text-yellow-400" bg="bg-yellow-500/10" />
              
              {/* Click to go to Activities Tab */}
              <div onClick={() => setActiveTab('activities')} className="cursor-pointer transition-transform hover:scale-105">
                <StatCard label="Progression" value={`${progressPercent}%`} icon={CalendarCheck} color="text-green-400" bg="bg-green-500/10" />
              </div>
            </div>
          </div>
        )}

        {/* 👇 NEW TAB: ACTIVITIES & TRACKING (SUIVI) */}
        {activeTab === 'activities' && (
            <div className="max-w-3xl space-y-6 animate-in fade-in">
                <div className="flex justify-between items-end mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Journal de bord</h2>
                        <p className="text-slate-400">Suivez votre avancement dans le festival</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {Object.entries(QUESTS).map(([code, quest]) => {
                        const isDone = user.badges?.includes(quest.badge);
                        return (
                            <div key={code} className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${isDone ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/5'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${isDone ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-slate-400'}`}>
                                        <quest.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg ${isDone ? 'text-white' : 'text-slate-300'}`}>{quest.label}</h3>
                                        <p className="text-sm text-slate-500">{quest.desc}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {isDone ? (
                                        <div className="flex items-center gap-2 text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-full text-sm">
                                            <CheckCircle2 size={16} /> Fait
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold text-yellow-400">+{quest.xp} XP</span>
                                            <span className="text-xs text-slate-500">À faire</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {activeTab === 'scanner' && (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in">
            {scanStatus === 'success' && (
                <div className="bg-green-500/10 border border-green-500/20 p-8 rounded-3xl flex flex-col items-center gap-4">
                    <CheckCircle2 size={48} className="text-green-400 animate-bounce" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Bravo !</h2>
                        <p className="text-green-300">Activité validée : {lastScan}</p>
                    </div>
                    <button onClick={() => setScanStatus('idle')} className="px-6 py-2 bg-white text-black font-bold rounded-full">Scanner encore</button>
                </div>
            )}

            {scanStatus === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl flex flex-col items-center gap-4">
                    <XCircle size={48} className="text-red-400" />
                    <h2 className="text-xl font-bold text-white">Oups !</h2>
                    <p className="text-red-300">{lastScan}</p>
                    <button onClick={() => setScanStatus('idle')} className="px-6 py-2 bg-white text-black font-bold rounded-full">Réessayer</button>
                </div>
            )}

            {scanStatus === 'idle' && !isScanning && (
                <button onClick={() => setIsScanning(true)} className="px-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:scale-105 transition-transform text-white rounded-2xl font-bold shadow-xl shadow-pink-600/20 flex items-center gap-2">
                    <ScanLine size={20} /> Lancer le Scanner
                </button>
            )}

            {isScanning && (
                <div className="relative w-full max-w-md aspect-square bg-black rounded-3xl overflow-hidden border-4 border-purple-500 shadow-2xl">
                    <Scanner 
                        onScan={handleScan} 
                        components={{ audio: false, finder: false }}
                    />
                    <button onClick={() => setIsScanning(false)} className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full z-50"><XCircle /></button>
                    {/* Finder Overlay */}
                    <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none z-10"></div>
                </div>
            )}
          </div>
        )}

        {activeTab === 'trophies' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in">
               {allBadges.map((badge) => {
                 const isUnlocked = user.badges?.includes(badge.req) || badge.req === "auto";
                 return (
                   <div key={badge.id} className={`p-6 rounded-2xl border transition-all ${isUnlocked ? 'bg-white/10 border-white/10' : 'bg-black/20 border-white/5 opacity-50 grayscale'}`}>
                     <div className="flex justify-between items-start mb-4">
                        <div className="text-3xl">{badge.icon}</div>
                        {!isUnlocked && <Lock size={16} />}
                     </div>
                     <h3 className="font-bold text-lg">{badge.title}</h3>
                     <p className="text-sm text-slate-400">{badge.desc}</p>
                   </div>
                 )
               })}
           </div>
        )}

      </main>
    </div>
  );
}

// 🧱 Components
function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all font-medium ${active ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <Icon size={20} />
      <span className="hidden md:block">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white/5 border border-white/5 p-6 rounded-3xl backdrop-blur-sm">
      <div className={`p-3 rounded-2xl w-fit mb-4 ${bg} ${color}`}><Icon size={24} /></div>
      <div className="text-4xl font-black mb-1">{value}</div>
      <div className="text-sm text-slate-400 font-medium">{label}</div>
    </div>
  );
}