'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { createClient } from '@supabase/supabase-js'; 
import { Home, ScanLine, User, LogOut, CheckCircle2, XCircle, ListTodo, Star, Loader2, Trophy, HelpCircle, ShieldAlert, RefreshCw, LayoutDashboard } from 'lucide-react';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const router = useRouter();
  
  // DATA STATES
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]); 
  const [myHistory, setMyHistory] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI STATES
  const [isScanning, setIsScanning] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  // Q&A MODAL STATES
  const [showQaModal, setShowQaModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [scanFeedback, setScanFeedback] = useState(null); 

  // --- 1. FETCH DATA ---
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }

      const { data: dbUser } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      setUser(dbUser || authUser);

      const { data: allActivities, error: actError } = await supabase.from('activities').select('*').order('id', { ascending: true });
      if (actError) console.error("Database Error (Activities):", actError.message);
      if (allActivities) setActivities(allActivities);

      const { data: history } = await supabase.from('user_activities').select('activity_id, is_correct').eq('user_id', authUser.id);
      if (history) setMyHistory(history);

    } catch (error) {
      console.error("Critical Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 2. CALCULATE PROGRESS ---
  const myDoneIds = myHistory.map(h => h.activity_id);
  const mandatoryActs = activities.filter(a => a.is_obligatory);
  const mandatoryTotal = mandatoryActs.length; 
  const mandatoryDone = mandatoryActs.filter(a => myDoneIds.includes(a.id)).length;
  const mandatoryPercent = mandatoryTotal === 0 ? 0 : Math.round((mandatoryDone / mandatoryTotal) * 100);

  const totalActs = activities.length;
  const totalDone = myDoneIds.length;
  const totalPercent = totalActs === 0 ? 0 : Math.round((totalDone / totalActs) * 100);

  // --- 3. ACTIONS ---
  const handleScan = (result) => {
    if (!result || !result[0]) return;
    const code = result[0].rawValue;
    setIsScanning(false); 

    const activity = activities.find(a => a.qr_code === code);
    if (!activity) {
        setScanFeedback({ type: 'error', msg: 'Code QR inconnu ou invalide.' });
        setShowQaModal(true); 
        return;
    }
    if (myDoneIds.includes(activity.id)) {
        setScanFeedback({ type: 'warning', msg: 'Vous avez déjà validé cette activité !' });
        setShowQaModal(true);
        return;
    }
    setCurrentActivity(activity);
    setUserAnswer('');
    setScanFeedback(null);
    setShowQaModal(true);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    try {
        const { data, error } = await supabase.rpc('attempt_scan', { 
            qr_text: currentActivity.qr_code, user_answer: userAnswer, device: 'web'
        });
        if (error) throw error;
        if (data && data.success) {
            setScanFeedback({ type: 'success', msg: data.msg });
            setTimeout(async () => { await fetchData(); setShowQaModal(false); setCurrentActivity(null); }, 1500);
        } else {
            setScanFeedback({ type: 'error', msg: data?.msg || "Mauvaise réponse" }); 
        }
    } catch (err) {
        console.error("Error submitting:", err);
        setScanFeedback({ type: 'error', msg: "Erreur technique." });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-sans pb-32 md:pb-0">
      
      {/* =======================
          MOBILE HEADER (Visible < 768px)
      ======================== */}
      <header className="md:hidden fixed top-0 w-full z-40 bg-[#0F0F1A]/90 backdrop-blur-xl border-b border-white/5 pt-10 pb-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter">FICAM <span className="text-purple-500">2026</span></h1>
        <div className="flex gap-3">
            <button onClick={fetchData} className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 active:scale-95 ${refreshing ? 'animate-spin' : ''}`}><RefreshCw size={18} /></button>
            <button onClick={() => setShowProfile(true)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><User size={18} /></button>
        </div>
      </header>

      {/* =======================
          DESKTOP SIDEBAR (Visible >= 768px)
      ======================== */}
      <aside className="hidden md:flex flex-col w-72 fixed h-full left-0 top-0 bg-[#15151e] border-r border-white/5 p-6 z-50">
          <div className="mb-10 pt-4">
             <h1 className="text-2xl font-black tracking-tighter">FICAM <span className="text-purple-500">2026</span></h1>
             <p className="text-slate-500 text-xs mt-1">Espace Étudiant</p>
          </div>

          <nav className="space-y-2 flex-1">
             <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="w-full flex items-center gap-3 p-3 bg-purple-600/10 text-purple-400 rounded-xl font-bold"><LayoutDashboard size={20}/> Tableau de bord</button>
             <button onClick={() => setIsScanning(true)} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-slate-400 rounded-xl font-bold transition-colors"><ScanLine size={20}/> Scanner un QR</button>
             <button onClick={() => setShowProfile(true)} className="w-full flex items-center gap-3 p-3 hover:bg-white/5 text-slate-400 rounded-xl font-bold transition-colors"><User size={20}/> Mon Profil</button>
          </nav>

          <div className="pt-6 border-t border-white/5">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-bold text-sm">{user?.email?.[0]?.toUpperCase()}</div>
                <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate">{user?.name || "Participant"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
             </div>
             <button onClick={handleLogout} className="w-full py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-500/20"><LogOut size={16}/> Déconnexion</button>
          </div>
      </aside>

      {/* =======================
          MAIN CONTENT AREA
      ======================== */}
      {/* Note: md:pl-80 pushes content right to make room for sidebar on PC */}
      <main className="pt-32 px-4 md:pt-10 md:pl-80 md:pr-10 max-w-lg md:max-w-none mx-auto space-y-8">
        
        {/* DESKTOP WELCOME HEADER */}
        <div className="hidden md:flex justify-between items-end mb-8 border-b border-white/5 pb-6">
            <div>
                <h2 className="text-3xl font-bold">Bonjour, {user?.name || "Participant"} 👋</h2>
                <p className="text-slate-400 mt-1">Voici ta progression pour le FICAM.</p>
            </div>
            <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg text-sm font-bold hover:bg-white/10 transition-colors">
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} /> Actualiser
            </button>
        </div>

        {/* RESPONSIVE GRID WRAPPER */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: Progress (Stacked on Mobile, Side on PC) */}
            <div className="xl:col-span-1 space-y-6">
                {/* Mandatory Card */}
                <div className="bg-gradient-to-br from-purple-900/40 to-[#1A1A24] border border-purple-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Star size={80} /></div>
                    <div className="relative z-10">
                        <h3 className="text-purple-300 font-bold uppercase text-xs tracking-wider mb-1">Parcours Obligatoire</h3>
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-4xl font-black text-white">{mandatoryDone}</span>
                            <span className="text-slate-400">/ {mandatoryTotal}</span>
                        </div>
                        <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 transition-all duration-1000" style={{ width: `${mandatoryPercent}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex gap-4">
                    <div className="bg-[#1A1A24] border border-white/5 rounded-3xl p-5 flex-1 shadow-lg">
                        <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-2">Total</h3>
                        <div className="text-2xl font-bold mb-2">{totalDone} <span className="text-sm text-slate-500">/ {totalActs}</span></div>
                        <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${totalPercent}%` }}></div>
                        </div>
                    </div>
                    <button disabled={mandatoryDone < 13} className={`flex-1 rounded-3xl p-5 border flex flex-col items-center justify-center text-center transition-all shadow-lg ${mandatoryDone >= 13 ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' : 'bg-[#1A1A24] border-white/5 text-slate-600 grayscale'}`}>
                        <Trophy size={24} className="mb-2" />
                        <span className="font-bold text-xs uppercase">Attestation</span>
                    </button>
                </div>
            </div>

            {/* RIGHT COLUMN: Activities List (Grid on PC, List on Mobile) */}
            <div className="xl:col-span-2">
                <h3 className="font-bold text-sm uppercase text-slate-500 mb-4 flex gap-2"><ListTodo size={16}/> Activités</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activities.length === 0 && (
                        <div className="col-span-full text-center bg-[#1A1A24] border border-red-500/20 rounded-xl p-6">
                           <p className="text-red-400 font-bold text-sm">Aucune activité visible</p>
                           <p className="text-xs text-slate-500 mt-2">Vérifiez vos permissions RLS.</p>
                        </div>
                    )}

                    {activities.map((act) => {
                        const isDone = myDoneIds.includes(act.id);
                        return (
                            <div key={act.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${isDone ? 'bg-green-900/10 border-green-500/20' : 'bg-[#1A1A24] border-white/5 hover:bg-white/5'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500 text-black' : (act.is_obligatory ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-slate-400')}`}>
                                    {isDone ? <CheckCircle2 size={20} /> : (act.icon === 'Star' ? <Star size={18} /> : <ScanLine size={18} />)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold text-sm truncate ${isDone ? 'text-green-400' : 'text-white'}`}>{act.title}</h4> 
                                    <div className="flex gap-2 items-center mt-1">
                                        {act.is_obligatory && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">OBLIGATOIRE</span>}
                                        <span className="text-xs text-slate-500 capitalize">{act.type}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </main>

      {/* =======================
          MOBILE BOTTOM NAV (Hidden >= 768px)
      ======================== */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#1A1A24]/90 backdrop-blur-xl border border-white/10 rounded-full p-2 flex justify-between items-center shadow-2xl z-50">
        <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="w-12 h-12 rounded-full flex items-center justify-center text-white"><Home size={20} /></button>
        <button onClick={() => setIsScanning(true)} className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center -mt-8 border-4 border-[#0F0F1A] shadow-lg shadow-purple-500/40 hover:scale-105 transition-transform"><ScanLine size={24} /></button>
        <button onClick={() => setShowProfile(true)} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400"><User size={20} /></button>
      </nav>

      {/* =======================
          MODALS (Scanner, Profile, Q&A)
      ======================== */}
      {/* 1. PROFILE MODAL */}
      {showProfile && (
       <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
           <div className="absolute inset-0" onClick={() => setShowProfile(false)}></div>
           <div className="bg-[#1A1A24] border border-white/10 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-in zoom-in-95">
               <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><XCircle size={24} /></button>
               <div className="flex flex-col items-center mb-6 pt-4">
                   <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center mb-4 text-white"><User size={32} /></div>
                   <h2 className="text-2xl font-bold text-center">{user?.name || "Participant"}</h2>
                   <p className="text-slate-400 text-sm mb-1">{user?.email}</p>
                   <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase text-slate-300">{user?.role || "Étudiant"}</span>
               </div>
               <div className="space-y-3">
                   {user?.role === 'admin' && (
                     <button onClick={() => router.push('/admin')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"><ShieldAlert size={18} /> Panel Admin</button>
                   )}
                   <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"><LogOut size={18} /> Déconnexion</button>
               </div>
           </div>
       </div>
      )}

      {/* 2. SCANNER VIEW */}
      {isScanning && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-md aspect-square relative rounded-3xl overflow-hidden border-2 border-white/20 bg-black">
                <Scanner onScan={handleScan} components={{ audio: false, finder: false }} styles={{ container: { width: '100%', height: '100%' } }} />
            </div>
            <p className="mt-4 text-slate-400 text-sm">Visez le QR Code de l'activité</p>
            <button onClick={() => setIsScanning(false)} className="mt-6 bg-white/10 px-8 py-3 rounded-full text-white font-bold">Fermer</button>
        </div>
      )}

      {/* 3. Q&A MODAL */}
      {showQaModal && (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
            <div className="bg-[#1A1A24] border border-white/10 w-full max-w-sm rounded-3xl p-6 flex flex-col relative shadow-2xl">
                {(!currentActivity || scanFeedback?.type === 'warning') && (
                     <div className="text-center py-4">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${scanFeedback?.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {scanFeedback?.type === 'success' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                        </div>
                        <p className="text-lg font-bold mb-6">{scanFeedback?.msg || "Erreur"}</p>
                        <button onClick={() => { setShowQaModal(false); setCurrentActivity(null); setScanFeedback(null); }} className="w-full py-3 bg-white text-black font-bold rounded-xl">Fermer</button>
                     </div>
                )}
                {currentActivity && (!scanFeedback || scanFeedback.type === 'error') && scanFeedback?.type !== 'warning' && (
                    <>
                        <div className="text-center mb-6">
                            <h3 className="text-purple-400 font-bold uppercase text-xs tracking-widest mb-2">Validation</h3>
                            <h2 className="text-2xl font-bold leading-tight">{currentActivity.title}</h2>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl mb-6">
                            <div className="flex gap-3">
                                <HelpCircle className="text-purple-400 shrink-0" size={24} />
                                <p className="font-medium text-sm text-purple-100">{currentActivity.question_text || "Confirmez votre présence :"}</p>
                            </div>
                        </div>
                        <input type="text" placeholder="Votre réponse..." className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white mb-4 focus:border-purple-500 outline-none" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} />
                        {scanFeedback?.type === 'error' && <p className="text-red-400 text-sm font-bold text-center mb-4">{scanFeedback.msg}</p>}
                        <div className="flex gap-3">
                            <button onClick={() => setShowQaModal(false)} className="flex-1 py-3 bg-white/5 text-slate-400 font-bold rounded-xl">Annuler</button>
                            <button onClick={submitAnswer} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20">Valider</button>
                        </div>
                    </>
                )}
                {scanFeedback?.type === 'success' && (
                     <div className="text-center py-6">
                        <div className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-4 text-black shadow-lg shadow-green-500/40"><CheckCircle2 size={40} /></div>
                        <h2 className="text-2xl font-bold mb-2">Validé !</h2>
                        <p className="text-slate-400">Activité enregistrée avec succès.</p>
                     </div>
                )}
            </div>
        </div>
      )}

    </div>
  );
}