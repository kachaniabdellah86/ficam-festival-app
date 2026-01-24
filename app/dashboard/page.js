'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { createClient } from '@supabase/supabase-js'; 
import { Home, ScanLine, User, LogOut, CheckCircle2, XCircle, ChevronRight, ListTodo, MapPin, Palette, Film, Mic, Star, ShieldAlert } from 'lucide-react';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const iconMap = { MapPin, Palette, Film, Mic, Star };

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [steps, setSteps] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedStep, setSelectedStep] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  
  // Debug State
  const [debugLog, setDebugLog] = useState("Initializing...");

  useEffect(() => {
    const init = async () => {
      // 1. Load from LocalStorage
      const storedString = localStorage.getItem('user');
      if (!storedString) { router.push('/login'); return; }
      
      let currentUser = JSON.parse(storedString);
      setUser(currentUser);
      setDebugLog(prev => prev + `\nLocal loaded: ${currentUser.role}`);

      // 2. FORCE SYNC from Database (The Critical Fix)
      try {
        const { data: dbUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', currentUser.email)
            .single();

        if (dbUser) {
            console.log("DB User Found:", dbUser);
            setDebugLog(prev => prev + `\nDB Fetched: "${dbUser.role}"`);
            currentUser = dbUser; // Update the reference
            setUser(dbUser); // Update State
            localStorage.setItem('user', JSON.stringify(dbUser)); // Update Storage
        } else {
            setDebugLog(prev => prev + `\nDB Fetch failed: User not found`);
        }
      } catch (err) {
        setDebugLog(prev => prev + `\nSync Error: ${err.message}`);
      }

      // 3. Load Steps
      const { data } = await supabase.from('steps').select('*').order('created_at', { ascending: true });
      if (data) setSteps(data);
      
      setLoading(false);
    };
    init();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleScan = async (result) => {
    if (!result || !result[0]) return;
    const code = result[0].rawValue;
    setIsScanning(false); 

    const step = steps.find(s => s.code === code);
    
    if (!step) {
        setScanResult({ success: false, msg: "QR Code inconnu." });
        return;
    }
    if (user.badges?.includes(step.id)) {
        setScanResult({ success: false, msg: "Déjà validé !" });
        return;
    }

    const updatedUser = { ...user, badges: [...(user.badges || []), step.id] };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setScanResult({ success: true, msg: `Validé: ${step.label}` });

    try {
        await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'update_progress', email: user.email, badgeId: step.id }),
        });
    } catch (e) { console.error(e); }
  };

  if (loading || !user) return <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center text-white">Chargement...</div>;

  const completedCount = user.badges?.length || 0;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps === 0 ? 0 : Math.round((completedCount / totalSteps) * 100);

  // 🛡️ ROBUST ADMIN CHECK 🛡️
  // We lowercase both sides to ensure 'Admin' == 'admin'
  const currentRole = user?.role || "undefined";
  const isAdmin = currentRole.toLowerCase().trim() === 'admin';

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-sans pb-24">
      
      {/* 🔴 DEBUG BAR: REMOVE AFTER FIXING 🔴 */}
     
      {/* 🔴 END DEBUG BAR 🔴 */}

      <header className="fixed top-0 w-full z-40 bg-[#0F0F1A]/90 backdrop-blur-xl border-b border-white/5 pt-10 pb-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter">FICAM <span className="text-purple-500">2026</span></h1>
        
        <div className="flex items-center gap-3">
            
            {/* 👇 ADMIN BUTTON 👇 */}
            {isAdmin && (
                <button 
                    onClick={() => router.push('/admin')}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-xs font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <Star size={14} fill="currentColor" /> ADMIN
                </button>
            )}

            <div className="text-right hidden sm:block">
                <p className="font-bold text-sm">{user.name}</p>
                <p className="text-xs text-slate-400">{completedCount}/{totalSteps}</p>
            </div>
            
            <button onClick={() => setShowProfile(true)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <User size={18} />
            </button>
        </div>
      </header>

      {/* PROFILE MODAL */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="absolute inset-0" onClick={() => setShowProfile(false)}></div>
            <div className="bg-[#1A1A24] border border-white/10 w-full max-w-sm rounded-3xl p-6 relative z-10">
                <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-slate-400"><XCircle size={24} /></button>
                <div className="flex flex-col items-center mb-6 pt-4">
                    <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center mb-4"><User size={32} /></div>
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    <p className="text-slate-400 text-sm">{user.email}</p>
                    <p className="text-xs text-slate-600 mt-2 font-mono">Role: {user.role}</p>
                </div>
                <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2">
                    <LogOut size={18} /> Déconnexion
                </button>
            </div>
        </div>
      )}
      
      {/* RESULT POPUP */}
      {scanResult && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-[#1A1A24] border border-white/10 w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${scanResult.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {scanResult.success ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                </div>
                <h2 className="text-2xl font-bold mb-2">{scanResult.success ? 'Succès' : 'Erreur'}</h2>
                <p className="text-slate-400 mb-6">{scanResult.msg}</p>
                <button onClick={() => setScanResult(null)} className="w-full py-3 bg-white text-black font-bold rounded-xl">Continuer</button>
            </div>
        </div>
      )}

      {/* STEP DETAILS */}
      {selectedStep && (
         <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6 animate-in slide-in-from-bottom-10 fade-in">
            <div className="absolute inset-0" onClick={() => setSelectedStep(null)}></div>
            <div className="bg-[#1A1A24] relative z-10 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-8 flex flex-col gap-4 border-t border-white/10">
                <h2 className="text-2xl font-bold">{selectedStep.label}</h2>
                <p className="text-slate-400">{selectedStep.description}</p>
                <div className="flex gap-3 mt-4">
                    <button onClick={() => setSelectedStep(null)} className="flex-1 py-3 bg-white/10 font-bold rounded-xl">Fermer</button>
                    <button onClick={() => { setSelectedStep(null); setIsScanning(true); }} className="flex-1 py-3 bg-purple-600 font-bold rounded-xl">Scanner</button>
                </div>
            </div>
         </div>
      )}

       {/* SCANNER MODAL */}
       {isScanning && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md aspect-square relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                <Scanner onScan={handleScan} components={{ audio: false, finder: false }} />
                <button onClick={() => setIsScanning(false)} className="absolute top-4 right-4 bg-black/60 p-2 rounded-full text-white z-50"><XCircle size={24} /></button>
            </div>
        </div>
      )}


      {/* MAIN CONTENT */}
      <main className="pt-32 px-4 max-w-lg mx-auto space-y-8">
        <div className="bg-purple-900/40 border border-purple-500/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="relative z-10">
                <h2 className="text-4xl font-black mb-2">{progressPercentage}%</h2>
                <p className="text-purple-200 text-sm">Progression globale</p>
                <div className="w-full bg-black/30 h-3 rounded-full mt-4 overflow-hidden">
                    <div className="h-full bg-white transition-all" style={{ width: `${progressPercentage}%` }}></div>
                </div>
            </div>
        </div>

        <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ListTodo size={20} className="text-purple-400" /> Étapes</h3>
            <div className="space-y-3">
                {steps.map((step) => {
                    const isDone = user.badges?.includes(step.id);
                    const IconComponent = iconMap[step.icon] || MapPin; 
                    return (
                        <button key={step.id} onClick={() => setSelectedStep(step)} className={`w-full text-left p-4 rounded-2xl border flex items-center gap-4 ${isDone ? 'bg-green-500/5 border-green-500/20' : 'bg-[#1A1A24] border-white/5'}`}>
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDone ? 'bg-green-600 text-white' : 'bg-white/5 text-slate-400'}`}>
                                {isDone ? <CheckCircle2 size={24} /> : <IconComponent size={20} />}
                            </div>
                            <div className="flex-1">
                                <h4 className={`font-bold text-sm ${isDone ? 'text-green-400' : 'text-slate-200'}`}>{step.label}</h4>
                                <p className="text-xs text-slate-500 line-clamp-1">{step.description}</p>
                            </div>
                            {isDone ? <CheckCircle2 size={18} className="text-green-600" /> : <ChevronRight size={20} className="text-slate-600" />}
                        </button>
                    );
                })}
            </div>
        </div>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#1A1A24]/90 backdrop-blur-xl border border-white/10 rounded-full p-2 flex justify-between items-center shadow-2xl z-50">
        <button className="w-12 h-12 rounded-full flex items-center justify-center bg-white/10 text-white"><Home size={20} /></button>
        <button onClick={() => setIsScanning(true)} className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center shadow-lg -mt-8 border-4 border-[#0F0F1A]"><ScanLine size={24} /></button>
        <button onClick={() => setShowProfile(true)} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400"><User size={20} /></button>
      </nav>
    </div>
  );
}