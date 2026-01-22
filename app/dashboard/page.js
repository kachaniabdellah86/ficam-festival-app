'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { Home, ScanLine, Trophy, User, LogOut, Flame, Sparkles, ChevronRight, CheckCircle2, XCircle, MapPin, Palette, Film, Mic, Lock } from 'lucide-react';

// 🗺️ DATA
const QUESTS = {
  'FICAM-WELCOME': { id: 'q1', xp: 50, badge: 2, label: "Bienvenue !", desc: "Scanner l'entrée", icon: MapPin, color: "from-blue-500 to-cyan-500" },
  'FICAM-WORKSHOP': { id: 'q2', xp: 100, badge: 4, label: "Atelier 3D", desc: "Participer au workshop", icon: Palette, color: "from-purple-500 to-pink-500" },
  'FICAM-MOVIE': { id: 'q3', xp: 30, badge: 3, label: "Le Roi Lion", desc: "Séance de 14h", icon: Film, color: "from-orange-500 to-red-500" },
  'FICAM-MASTER': { id: 'q4', xp: 200, badge: 6, label: "Masterclass", desc: "Rencontre VIP", icon: Mic, color: "from-emerald-500 to-green-500" },
};

const BADGES = [
    { id: 1, title: "Explorateur", icon: "🚀", req: "auto" },
    { id: 2, title: "Premier Pas", icon: "📸", req: 2 }, 
    { id: 3, title: "Cinéphile", icon: "🎬", req: 3 },
    { id: 4, title: "Artiste", icon: "🎨", req: 4 },
    { id: 6, title: "Légende", icon: "👑", req: 6 },
];

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null); // 'success' | 'error' | null
  const [scanMessage, setScanMessage] = useState('');

  // 🔄 Load User
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/login');
    else setUser(JSON.parse(stored));
  }, [router]);

  // 🚪 Logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // 📸 Handle Scan
  const handleScan = async (result) => {
    if (!result || !result[0]) return;
    const code = result[0].rawValue;
    setIsScanning(false); // Stop camera immediately

    const quest = QUESTS[code];
    if (!quest) {
        setScanResult('error');
        setScanMessage("Ce QR Code n'est pas valide.");
        return;
    }

    if (user.badges?.includes(quest.badge)) {
        setScanResult('error');
        setScanMessage("Tu as déjà validé cette quête !");
        return;
    }

    // Success Logic
    const updatedUser = { ...user, xp: (user.xp || 0) + quest.xp, badges: [...(user.badges || []), quest.badge] };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setScanResult('success');
    setScanMessage(`Bravo ! +${quest.xp} XP`);

    // Sync DB (Silent)
    try {
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_progress', email: user.email, xpToAdd: quest.xp, badgeId: quest.badge }),
        });
    } catch (e) { console.error(e); }
  };

  if (!user) return <div className="min-h-screen bg-black" />;

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 pb-24">
      
      {/* 🌟 HEADER (Sticky Top) */}
      <header className="fixed top-0 w-full z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 pt-12 pb-4 px-6 flex justify-between items-center">
        <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                FICAM
            </h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
                <p className="font-bold text-sm">{user.name}</p>
                <p className="text-xs text-slate-400">{user.xp || 0} XP</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-blue-600 p-[2px]">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
                    <User size={18} className="text-white" />
                </div>
            </div>
        </div>
      </header>
      
      {/* 🛑 SCANNER OVERLAY (Full Screen) */}
      {isScanning && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
            <div className="flex-1 relative">
                <Scanner onScan={handleScan} components={{ audio: false, finder: false }} />
                {/* Custom Overlay */}
                <div className="absolute inset-0 border-[60px] border-black/60 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-purple-500 -mt-1 -ml-1 rounded-tl-xl"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-purple-500 -mt-1 -mr-1 rounded-tr-xl"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-purple-500 -mb-1 -ml-1 rounded-bl-xl"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-purple-500 -mb-1 -mr-1 rounded-br-xl"></div>
                    </div>
                </div>
                <button 
                    onClick={() => setIsScanning(false)} 
                    className="absolute top-12 right-6 bg-white/10 backdrop-blur-md p-3 rounded-full text-white z-50">
                    <XCircle size={28} />
                </button>
            </div>
            <div className="h-40 bg-black flex flex-col items-center justify-center text-center px-6">
                <p className="font-bold text-lg mb-1">Scanne un QR Code</p>
                <p className="text-slate-400 text-sm">Vise le code présent sur le stand</p>
            </div>
        </div>
      )}

      {/* ✅ RESULT MODAL (Popup) */}
      {scanResult && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-[#1A1A24] border border-white/10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
                {scanResult === 'success' ? (
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-400 animate-bounce">
                        <CheckCircle2 size={40} />
                    </div>
                ) : (
                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 text-red-400">
                        <XCircle size={40} />
                    </div>
                )}
                <h2 className="text-2xl font-bold mb-2">{scanResult === 'success' ? 'Succès !' : 'Oups'}</h2>
                <p className="text-slate-400 mb-8">{scanMessage}</p>
                <button 
                    onClick={() => setScanResult(null)}
                    className="w-full py-4 bg-white text-black font-bold rounded-xl active:scale-95 transition-transform"
                >
                    Continuer
                </button>
            </div>
        </div>
      )}

      {/* 📱 MAIN CONTENT (Scrollable) */}
      <main className="pt-28 px-4 max-w-lg mx-auto space-y-8">

        {activeTab === 'home' && (
            <>
                {/* 1. Hero Card */}
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-6 shadow-2xl shadow-purple-900/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20"><Sparkles size={100} /></div>
                    <div className="relative z-10">
                        <p className="text-purple-200 font-medium mb-1">Ton Score Actuel</p>
                        <h2 className="text-5xl font-black mb-4">{user.xp || 0} <span className="text-2xl opacity-70">XP</span></h2>
                        <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-white/90 w-[45%]"></div>
                        </div>
                        <p className="text-xs text-purple-200 mt-2 text-right">Prochain niveau à 500 XP</p>
                    </div>
                </div>

                {/* 2. Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setIsScanning(true)} className="bg-[#1A1A24] active:bg-[#252532] border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 aspect-square transition-colors">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <ScanLine size={24} />
                        </div>
                        <span className="font-bold text-sm">Scanner</span>
                    </button>
                    <button onClick={() => setActiveTab('trophies')} className="bg-[#1A1A24] active:bg-[#252532] border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 aspect-square transition-colors">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                            <Trophy size={24} />
                        </div>
                        <span className="font-bold text-sm">Mes Trophées</span>
                    </button>
                </div>

                {/* 3. Quest List */}
                <div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Flame size={18} className="text-orange-500" /> Quêtes disponibles
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(QUESTS).map(([key, quest]) => {
                            const isDone = user.badges?.includes(quest.badge);
                            return (
                                <div key={key} className={`p-4 rounded-2xl border flex items-center gap-4 ${isDone ? 'bg-green-900/10 border-green-500/30 opacity-60' : 'bg-[#1A1A24] border-white/5'}`}>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${quest.color}`}>
                                        <quest.icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-sm">{quest.label}</h4>
                                        <p className="text-xs text-slate-400">{quest.desc}</p>
                                    </div>
                                    <div className="text-right">
                                        {isDone ? (
                                            <CheckCircle2 size={20} className="text-green-500" />
                                        ) : (
                                            <span className="font-bold text-sm text-purple-400">+{quest.xp}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </>
        )}

        {activeTab === 'trophies' && (
            <div className="space-y-6">
                 <h2 className="text-2xl font-bold px-2">Ta Collection</h2>
                 <div className="grid grid-cols-3 gap-3">
                    {BADGES.map((badge) => {
                        const unlocked = user.badges?.includes(badge.req) || badge.req === "auto";
                        return (
                            <div key={badge.id} className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 p-2 text-center border ${unlocked ? 'bg-[#1A1A24] border-purple-500/30 shadow-lg shadow-purple-900/10' : 'bg-black border-white/5 opacity-40'}`}>
                                <div className="text-3xl">{badge.icon}</div>
                                <p className="text-[10px] font-bold uppercase tracking-wider">{badge.title}</p>
                                {!unlocked && <Lock size={12} className="text-slate-500" />}
                            </div>
                        )
                    })}
                 </div>
                 <button onClick={() => setActiveTab('home')} className="w-full py-4 text-slate-400 font-medium">Retour</button>
            </div>
        )}

      </main>

      {/* 📱 BOTTOM NAVIGATION (Floating iOS Style) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white/10 backdrop-blur-xl border border-white/10 rounded-full p-2 flex justify-between items-center shadow-2xl z-50">
        
        <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} icon={Home} />
        
        {/* CENTER SCAN BUTTON */}
        <button 
            onClick={() => setIsScanning(true)}
            className="w-14 h-14 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/40 text-white -mt-8 border-4 border-black transition-transform active:scale-95"
        >
            <ScanLine size={24} />
        </button>

        <NavButton active={activeTab === 'trophies'} onClick={() => setActiveTab('trophies')} icon={Trophy} />

      </nav>
    </div>
  );
}

// ✨ Helper Component
function NavButton({ active, onClick, icon: Icon }) {
    return (
        <button onClick={onClick} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${active ? 'text-white bg-white/10' : 'text-slate-400'}`}>
            <Icon size={20} />
        </button>
    )
}