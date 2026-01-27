'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { createClient } from '@supabase/supabase-js'; 
import { Toaster, toast } from 'sonner'; 
import { 
  Home, ScanLine, User, LogOut, CheckCircle2, XCircle, 
  ListTodo, Star, Loader2, Trophy, HelpCircle, ChevronRight, 
  Clock, ShieldCheck, Zap, Lock
} from 'lucide-react';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const router = useRouter();
  
  // --- DATA STATES ---
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]); 
  const [myHistory, setMyHistory] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // --- UI STATES ---
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'profile'
  const [isScanning, setIsScanning] = useState(false);
  
  // --- Q&A STATES ---
  const [showQaModal, setShowQaModal] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [scanFeedback, setScanFeedback] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- 1. DATA FETCHING ---
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }

      // Get profile
      const { data: dbUser } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      setUser(dbUser || authUser);

      // Get Activities
      const { data: allActivities } = await supabase.from('activities').select('*').order('id', { ascending: true });
      if (allActivities) setActivities(allActivities);

      // Get History
      const { data: history } = await supabase.from('user_activities').select('activity_id, is_correct').eq('user_id', authUser.id);
      if (history) setMyHistory(history);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 2. CALCULATIONS ---
  const myDoneIds = myHistory.map(h => h.activity_id);
  const totalActs = activities.length;
  const totalDone = myDoneIds.length;
  const totalPercent = totalActs === 0 ? 0 : Math.round((totalDone / totalActs) * 100);

  // Rank System - Matching Admin Colors
  const getRank = () => {
    if (totalPercent === 100) return { title: "MASTER", gradient: "from-yellow-400 to-orange-500", text: "text-yellow-400", border: "border-yellow-500/50" };
    if (totalPercent >= 75) return { title: "ELITE", gradient: "from-violet-500 to-fuchsia-500", text: "text-fuchsia-400", border: "border-fuchsia-500/50" };
    if (totalPercent >= 50) return { title: "AGENT", gradient: "from-blue-400 to-cyan-400", text: "text-cyan-400", border: "border-cyan-500/50" };
    return { title: "ROOKIE", gradient: "from-slate-400 to-slate-500", text: "text-slate-400", border: "border-slate-600/50" };
  };
  const rank = getRank();

  // --- 3. ACTIONS ---
  const handleScan = (result) => {
    if (!result || !result[0]) return;
    
    setIsScanning(false); 
    const code = result[0].rawValue;
    const activity = activities.find(a => a.qr_code === code);
    
    if (!activity) {
        setScanFeedback({ type: 'error', msg: 'QR Code non reconnu.' });
        setShowQaModal(true); return;
    }
    if (myDoneIds.includes(activity.id)) {
        setScanFeedback({ type: 'warning', msg: 'Badge déjà validé !' });
        setShowQaModal(true); return;
    }

    setCurrentActivity(activity);
    setUserAnswer('');
    setScanFeedback(null);
    setShowQaModal(true);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    setIsSubmitting(true);

    try {
        const { data, error } = await supabase.rpc('attempt_scan', { 
            qr_text: currentActivity.qr_code, 
            user_answer: userAnswer, 
            device: 'web'
        });

        if (error) throw error;

        if (data && data.success) {
            setMyHistory(prev => [...prev, { activity_id: currentActivity.id, is_correct: true }]);
            setScanFeedback({ type: 'success', msg: data.msg });
            setTimeout(async () => { 
                setShowQaModal(false); 
                setCurrentActivity(null); 
                await fetchData(false); 
            }, 1500);
        } else {
            setScanFeedback({ type: 'error', msg: data?.msg || "Réponse incorrecte" }); 
        }
    } catch (err) {
        setScanFeedback({ type: 'error', msg: "Erreur technique." });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="fixed inset-0 bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  return (
    // MAIN CONTAINER: Changed pb-24 to pb-36 for better scrolling
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 pb-36 relative overflow-x-hidden">
      
      {/* --- AMBIENT BACKGROUND GLOW --- */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full z-40 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex justify-between items-center safe-top">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">F</div>
            <div>
                <h1 className="font-bold text-lg tracking-tight leading-none text-white">FICAM <span className="text-indigo-400">2026</span></h1>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Espace Participant</p>
            </div>
        </div>
        <div className="flex items-center gap-4">
             <div onClick={() => setActiveTab('profile')} className="w-9 h-9 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center cursor-pointer hover:bg-slate-700 transition-colors">
                <User size={16} className="text-slate-300"/>
             </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="relative z-10 pt-28 px-4 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* VIEW: HOME */}
        {activeTab === 'home' && (
            <div className="space-y-6">
                
                {/* 1. HERO STATS (BENTO GRID) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    {/* Rank Card - Large */}
                    <div className="col-span-2 bg-[#0f172a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${rank.gradient} opacity-10 blur-2xl rounded-full group-hover:opacity-20 transition-opacity`}></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Votre Rang</h3>
                                <Trophy size={16} className={rank.text} />
                            </div>
                            <div className={`text-4xl font-black italic bg-gradient-to-br ${rank.gradient} bg-clip-text text-transparent mb-3`}>{rank.title}</div>
                            
                            {/* Progress Bar */}
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <div className={`h-full bg-gradient-to-r ${rank.gradient} transition-all duration-1000 ease-out`} style={{ width: `${totalPercent}%` }}></div>
                            </div>
                            <div className="mt-2 flex justify-between text-xs font-medium text-slate-400">
                                <span>Progression</span>
                                <span className="text-white">{totalPercent}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Small 1 */}
                    <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                         <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                            <ShieldCheck className="text-emerald-500" size={20} />
                         </div>
                         <span className="text-2xl font-bold text-white">{totalDone}</span>
                         <span className="text-[10px] uppercase text-slate-500 font-bold">Validés</span>
                    </div>

                    {/* Stats Small 2 */}
                    <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center">
                         <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2">
                            <Star className="text-indigo-500" size={20} />
                         </div>
                         <span className="text-2xl font-bold text-white">{totalActs - totalDone}</span>
                         <span className="text-[10px] uppercase text-slate-500 font-bold">Restants</span>
                    </div>
                </div>

                {/* 2. ACTIVITY LIST */}
                <div>
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
                            <ListTodo className="text-indigo-500" size={20}/> Missions
                        </h3>
                        <button onClick={() => fetchData(true)} className={`text-xs font-bold text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors ${refreshing ? 'animate-pulse' : ''}`}>
                            <Zap size={12}/> {refreshing ? '...' : 'Actualiser'}
                        </button>
                    </div>

                    <div className="space-y-3">
                        {activities.map((act) => {
                            const isDone = myDoneIds.includes(act.id);
                            return (
                                <div key={act.id} className={`group relative p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${isDone ? 'bg-[#0f172a]/80 border-emerald-500/20' : 'bg-[#0f172a]/40 border-white/5 hover:border-indigo-500/30'}`}>
                                    
                                    <div className="flex items-center gap-4 relative z-10">
                                        {/* Icon Box */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${isDone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500 group-hover:text-indigo-400 group-hover:bg-indigo-500/10'}`}>
                                            {isDone ? <CheckCircle2 size={22} /> : (act.is_obligatory ? <Lock size={20} /> : <ScanLine size={20} />)}
                                        </div>
                                        
                                        {/* Text Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className={`font-bold text-sm truncate pr-2 ${isDone ? 'text-emerald-400' : 'text-slate-200'}`}>{act.title}</h4>
                                                {isDone && <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md uppercase tracking-wide">Fait</span>}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                <span className="text-[10px] font-medium text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wide">
                                                    {act.type || 'Général'}
                                                </span>
                                                {act.is_obligatory && <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">OBLIGATOIRE</span>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Hover Glow Effect */}
                                    {!isDone && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )}

        {/* VIEW: PROFILE */}
        {activeTab === 'profile' && (
            <div className="max-w-md mx-auto bg-[#0f172a] border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
                {/* Profile Header Gradient */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-900/30 to-transparent"></div>
                
                <div className="relative z-10">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-[#0f172a] shadow-xl mb-4 text-white">
                        {user?.email?.[0]?.toUpperCase()}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{user?.name || "Participant"}</h2>
                    <p className="text-slate-400 text-sm mb-6">{user?.email}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                         <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
                             <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Role</div>
                             <div className="text-indigo-400 font-bold capitalize">{user?.role || 'Étudiant'}</div>
                         </div>
                         <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl">
                             <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">ID</div>
                             <div className="text-slate-300 font-medium truncate">#{user?.id?.slice(0,6)}</div>
                         </div>
                    </div>

                    <button onClick={handleLogout} className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/20">
                        <LogOut size={18} /> Déconnexion
                    </button>
                </div>
            </div>
        )}
      </main>

      {/* --- BOTTOM NAVIGATION (MOBILE) --- */}
      {/* ADDED style for safe-area-inset-bottom to handle iPhone White Bar */}
      <nav 
        className="fixed bottom-0 w-full z-30 bg-[#020617]/90 backdrop-blur-xl border-t border-white/10 px-6 pt-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)' }}
      >
          <div className="flex justify-around items-center h-16 max-w-md mx-auto">
              <button 
                  onClick={() => setActiveTab('home')}
                  className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-indigo-500' : 'text-slate-600 hover:text-slate-400'}`}
              >
                  <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                  <span className="text-[10px] font-bold">Accueil</span>
              </button>

              {/* Floating Action Button for Scan */}
              <div className="relative -top-6">
                  <button 
                      onClick={() => setIsScanning(true)}
                      className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30 border-[6px] border-[#020617] hover:scale-105 transition-transform active:scale-95 group"
                  >
                      <ScanLine size={26} className="group-hover:rotate-90 transition-transform" />
                  </button>
              </div>

              <button 
                  onClick={() => setActiveTab('profile')}
                  className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-indigo-500' : 'text-slate-600 hover:text-slate-400'}`}
              >
                  <User size={24} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
                  <span className="text-[10px] font-bold">Profil</span>
              </button>
          </div>
      </nav>

      {/* --- FULL SCREEN SCANNER MODAL --- */}
      {isScanning && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-200">
            
            {/* Scanner Controls - Added pt-12 to clear top safe area */}
            <div className="absolute top-0 left-0 w-full p-6 pt-12 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <span className="text-white font-bold text-sm flex items-center gap-2"><ScanLine size={16} className="text-indigo-500 animate-pulse"/> Mode Scan</span>
                </div>
                <button onClick={() => setIsScanning(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-md border border-white/10 hover:bg-white/20"><XCircle size={24}/></button>
            </div>

            {/* The Scanner Component */}
            <div className="flex-1 w-full h-full relative bg-black flex items-center justify-center overflow-hidden">
                <Scanner 
                    onScan={handleScan}
                    components={{ audio: false, finder: false }} 
                    styles={{ container: { width: '100%', height: '100%' }, video: { objectFit: 'cover' } }} 
                />
                
                {/* Custom Targeting Reticle */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    {/* Dark overlay with hole */}
                    <div className="absolute inset-0 bg-black/40"></div>
                    
                    {/* The Box */}
                    <div className="relative w-72 h-72 border border-white/20 rounded-3xl bg-transparent z-10 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                         {/* Corners */}
                         <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-indigo-500 rounded-tl-2xl"></div>
                         <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-indigo-500 rounded-tr-2xl"></div>
                         <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-indigo-500 rounded-bl-2xl"></div>
                         <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-indigo-500 rounded-br-2xl"></div>
                         
                         {/* Scanning Laser */}
                         <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>
                </div>
                
                <div className="absolute bottom-24 text-center w-full z-20">
                     <p className="text-white/90 text-sm font-medium bg-black/60 inline-block px-6 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-lg">Pointez le code QR</p>
                </div>
            </div>
        </div>
      )}

      {/* --- Q&A MODAL (Glassmorphism) --- */}
      {showQaModal && (
        <div className="fixed inset-0 z-[110] bg-[#020617]/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-[#0f172a] border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl relative ring-1 ring-white/5">
               
               <div className="p-6 relative z-10">
                   {/* ERROR / WARNING STATE */}
                   {(!currentActivity || scanFeedback?.type === 'warning' || (scanFeedback?.type === 'error' && !currentActivity)) && (
                         <div className="text-center py-4">
                             <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${scanFeedback?.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                 {scanFeedback?.type === 'success' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                             </div>
                             <h3 className="text-xl font-bold text-white mb-2">{scanFeedback?.type === 'success' ? 'Succès' : 'Attention'}</h3>
                             <p className="text-slate-400 text-sm mb-6">{scanFeedback?.msg}</p>
                             <button onClick={() => { setShowQaModal(false); setCurrentActivity(null); setScanFeedback(null); }} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors">Fermer</button>
                         </div>
                   )}

                   {/* QUESTION INPUT STATE */}
                   {currentActivity && (!scanFeedback || scanFeedback.type === 'error') && scanFeedback?.type !== 'warning' && (
                       <>
                           <div className="text-center mb-6">
                               <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-400 border border-indigo-500/20">
                                   <HelpCircle size={24} />
                               </div>
                               <h2 className="text-lg font-bold text-white leading-snug">{currentActivity.title}</h2>
                               <p className="text-[10px] text-indigo-400 uppercase mt-1 tracking-widest font-bold">Validation Requise</p>
                           </div>
                           
                           <div className="bg-slate-900/50 p-4 rounded-xl mb-4 border border-white/5">
                                <p className="font-medium text-sm text-slate-300 text-center">{currentActivity.question_text || "Entrez la réponse secrète pour valider :"}</p>
                           </div>
                           
                           <input 
                               type="text" 
                               placeholder="Réponse..." 
                               autoFocus
                               className="w-full bg-[#020617] border border-white/10 rounded-xl p-4 text-white mb-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600" 
                               value={userAnswer} 
                               onChange={(e) => setUserAnswer(e.target.value)} 
                               onKeyDown={(e) => e.key === 'Enter' && submitAnswer()}
                           />
                           
                           {scanFeedback?.type === 'error' && <p className="text-red-400 text-xs font-bold text-center mb-4 animate-pulse">{scanFeedback.msg}</p>}

                           <div className="flex gap-3">
                               <button onClick={() => setShowQaModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors">Annuler</button>
                               <button 
                                   onClick={submitAnswer} 
                                   disabled={isSubmitting || !userAnswer.trim()}
                                   className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                               >
                                   {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <>Valider <ChevronRight size={16}/></>}
                               </button>
                           </div>
                       </>
                   )}

                   {/* SUCCESS STATE */}
                   {scanFeedback?.type === 'success' && (
                         <div className="text-center py-6 animate-in zoom-in-50">
                             <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mb-4 text-white shadow-[0_0_30px_rgba(16,185,129,0.4)]"><CheckCircle2 size={40} /></div>
                             <h2 className="text-2xl font-bold text-white mb-1">Badge Débloqué !</h2>
                             <p className="text-slate-400 text-sm">Félicitations, continuez comme ça.</p>
                         </div>
                   )}
               </div>
            </div>
        </div>
      )}
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}