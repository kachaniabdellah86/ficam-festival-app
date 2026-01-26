'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Scanner } from '@yudiel/react-qr-scanner'; 
import { createClient } from '@supabase/supabase-js'; 
import { Home, ScanLine, User, LogOut, CheckCircle2, XCircle, ListTodo, Star, Loader2, Trophy, HelpCircle, ShieldAlert, RefreshCw } from 'lucide-react';

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

  // --- 1. FETCH DATA (Wrapped in useCallback) ---
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // A. Get Auth User
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push('/login'); return; }

      // B. Get User Details
      const { data: dbUser } = await supabase.from('users').select('*').eq('id', authUser.id).single();
      setUser(dbUser || authUser);

      // C. Get All Activities (Debug added)
      const { data: allActivities, error: actError } = await supabase
        .from('activities') 
        .select('*')
        .order('id', { ascending: true });
      
      if (actError) console.error("Database Error (Activities):", actError.message);
      if (allActivities) setActivities(allActivities);

      // D. Get My History
      const { data: history } = await supabase
        .from('user_activities') 
        .select('activity_id, is_correct')
        .eq('user_id', authUser.id);
      
      if (history) setMyHistory(history);

    } catch (error) {
      console.error("Critical Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 2. CALCULATE PROGRESS ---
  const myDoneIds = myHistory.map(h => h.activity_id);

  // Mandatory Progress
  const mandatoryActs = activities.filter(a => a.is_obligatory);
  const mandatoryTotal = mandatoryActs.length; 
  const mandatoryDone = mandatoryActs.filter(a => myDoneIds.includes(a.id)).length;
  const mandatoryPercent = mandatoryTotal === 0 ? 0 : Math.round((mandatoryDone / mandatoryTotal) * 100);

  // Global Progress
  const totalActs = activities.length;
  const totalDone = myDoneIds.length;
  const totalPercent = totalActs === 0 ? 0 : Math.round((totalDone / totalActs) * 100);

  // --- 3. SCANNING LOGIC ---
  const handleScan = (result) => {
    if (!result || !result[0]) return;
    
    const code = result[0].rawValue;
    setIsScanning(false); 

    // Find activity locally
    const activity = activities.find(a => a.qr_code === code);

    if (!activity) {
        setScanFeedback({ type: 'error', msg: 'Code QR inconnu ou invalide.' });
        setShowQaModal(true); 
        return;
    }

    // Check if already done
    if (myDoneIds.includes(activity.id)) {
        setScanFeedback({ type: 'warning', msg: 'Vous avez déjà validé cette activité !' });
        setShowQaModal(true);
        return;
    }

    // Found valid activity -> Open Q&A Modal
    setCurrentActivity(activity);
    setUserAnswer('');
    setScanFeedback(null);
    setShowQaModal(true);
  };

  // --- 4. SUBMIT ANSWER LOGIC ---
  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;

    try {
        // NOTE: Ensure you have created the 'attempt_scan' function in Supabase RPC
        // If not, you should use standard .insert() like in the previous example.
        const { data, error } = await supabase.rpc('attempt_scan', { 
            qr_text: currentActivity.qr_code,
            user_answer: userAnswer,
            device: 'mobile'
        });

        if (error) throw error;

        if (data && data.success) {
            setScanFeedback({ type: 'success', msg: data.msg });
            setTimeout(async () => {
                await fetchData(); // Refresh data to show green checkmark
                setShowQaModal(false);
                setCurrentActivity(null);
            }, 1500);
        } else {
            setScanFeedback({ type: 'error', msg: data?.msg || "Mauvaise réponse" }); 
        }
    } catch (err) {
        console.error("Error submitting:", err);
        setScanFeedback({ type: 'error', msg: "Erreur technique ou réponse incorrecte." });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#0F0F1A] text-white font-sans pb-32">
      
      {/* HEADER */}
      <header className="fixed top-0 w-full z-40 bg-[#0F0F1A]/90 backdrop-blur-xl border-b border-white/5 pt-10 pb-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter">FICAM <span className="text-purple-500">2026</span></h1>
        
        <div className="flex gap-3">
             {/* Refresh Button - Useful if admin adds questions while user is on app */}
            <button onClick={fetchData} className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 active:scale-95 ${refreshing ? 'animate-spin' : ''}`}>
                <RefreshCw size={18} />
            </button>

            <button onClick={() => setShowProfile(true)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
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
                   <h2 className="text-2xl font-bold">{user?.name || "Participant"}</h2>
                   <p className="text-slate-400 text-sm mb-1">{user?.email}</p>
                   <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wide text-slate-300">
                     {user?.role || "Étudiant"}
                   </span>
               </div>

               <div className="space-y-3">
                   {/* ADMIN BUTTON */}
                   {user?.role === 'admin' && (
                     <button 
                       onClick={() => router.push('/admin')} 
                       className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                     >
                         <ShieldAlert size={18} /> Panel Admin
                     </button>
                   )}

                   <button 
                     onClick={handleLogout} 
                     className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                   >
                       <LogOut size={18} /> Déconnexion
                   </button>
               </div>
           </div>
       </div>
      )}

      {/* SCANNER VIEW */}
      {isScanning && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center p-4">
             <div className="w-full max-w-md aspect-square relative rounded-3xl overflow-hidden border-2 border-white/20 bg-black">
                <Scanner onScan={handleScan} components={{ audio: false, finder: false }} styles={{ container: { width: '100%', height: '100%' } }} />
            </div>
            <p className="mt-4 text-slate-400 text-sm">Visez le QR Code de l'activité</p>
            <button onClick={() => setIsScanning(false)} className="mt-6 bg-white/10 px-8 py-3 rounded-full text-white font-bold">Fermer</button>
        </div>
      )}

      {/* Q&A / RESULT MODAL */}
      {showQaModal && (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in-95">
            <div className="bg-[#1A1A24] border border-white/10 w-full max-w-sm rounded-3xl p-6 flex flex-col relative">
                
                {/* CASE 1: Error or Warning */}
                {(!currentActivity || scanFeedback?.type === 'warning') && (
                     <div className="text-center py-4">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${scanFeedback?.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {scanFeedback?.type === 'success' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                        </div>
                        <p className="text-lg font-bold mb-6">{scanFeedback?.msg || "Erreur"}</p>
                        <button onClick={() => { setShowQaModal(false); setCurrentActivity(null); setScanFeedback(null); }} className="w-full py-3 bg-white text-black font-bold rounded-xl">Fermer</button>
                     </div>
                )}

                {/* CASE 2: Active Question */}
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

                        <input 
                            type="text" 
                            placeholder="Votre réponse..." 
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white mb-4 focus:border-purple-500 outline-none"
                            value={userAnswer}
                            onChange={(e) => setUserAnswer(e.target.value)}
                        />

                        {scanFeedback?.type === 'error' && (
                            <p className="text-red-400 text-sm font-bold text-center mb-4">{scanFeedback.msg}</p>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setShowQaModal(false)} className="flex-1 py-3 bg-white/5 text-slate-400 font-bold rounded-xl">Annuler</button>
                            <button onClick={submitAnswer} className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20">Valider</button>
                        </div>
                    </>
                )}

                {/* CASE 3: Success Message */}
                {scanFeedback?.type === 'success' && (
                     <div className="text-center py-6">
                        <div className="mx-auto w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-4 text-black shadow-lg shadow-green-500/40">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Validé !</h2>
                        <p className="text-slate-400">Activité enregistrée avec succès.</p>
                     </div>
                )}
            </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className="pt-32 px-4 max-w-lg mx-auto space-y-8">
        
        {/* PROGRESS CARDS */}
        <div className="grid grid-cols-1 gap-4">
            {/* Mandatory Card */}
            <div className="bg-gradient-to-br from-purple-900/40 to-[#1A1A24] border border-purple-500/30 rounded-3xl p-6 relative overflow-hidden">
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

            {/* Total & Certificate Row */}
            <div className="flex gap-4">
                <div className="bg-[#1A1A24] border border-white/5 rounded-3xl p-5 flex-1">
                    <h3 className="text-slate-500 font-bold uppercase text-[10px] tracking-wider mb-2">Total</h3>
                    <div className="text-2xl font-bold mb-2">{totalDone} <span className="text-sm text-slate-500">/ {totalActs}</span></div>
                    <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 transition-all duration-1000" style={{ width: `${totalPercent}%` }}></div>
                    </div>
                </div>

                <button 
                    disabled={mandatoryDone < 13}
                    className={`flex-1 rounded-3xl p-5 border flex flex-col items-center justify-center text-center transition-all ${
                        mandatoryDone >= 13 
                        ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400' 
                        : 'bg-[#1A1A24] border-white/5 text-slate-600 grayscale'
                    }`}
                >
                    <Trophy size={24} className="mb-2" />
                    <span className="font-bold text-xs uppercase">Attestation</span>
                    <span className="text-[10px] opacity-70 mt-1">{mandatoryDone >= 13 ? 'Débloquée' : 'Verrouillée'}</span>
                </button>
            </div>
        </div>

        {/* LIST */}
        <div className="space-y-3">
            <h3 className="font-bold text-sm uppercase text-slate-500 mb-2 flex gap-2"><ListTodo size={16}/> Activités</h3>
            
            {activities.length === 0 && (
                <div className="text-center bg-[#1A1A24] border border-red-500/20 rounded-xl p-6">
                    <p className="text-red-400 font-bold text-sm">Aucune activité visible</p>
                    <p className="text-xs text-slate-500 mt-2">
                        Si vous êtes admin, vérifiez vos permissions Supabase (RLS).
                    </p>
                </div>
            )}

            {activities.map((act) => {
                const isDone = myDoneIds.includes(act.id);
                return (
                    <div key={act.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${isDone ? 'bg-green-900/10 border-green-500/20' : 'bg-[#1A1A24] border-white/5'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-green-500 text-black' : (act.is_obligatory ? 'bg-purple-500/20 text-purple-400' : 'bg-white/10 text-slate-400')}`}>
                            {isDone ? <CheckCircle2 size={20} /> : (act.icon === 'Star' ? <Star size={18} /> : <ScanLine size={18} />)}
                        </div>
                        <div className="flex-1">
                            <h4 className={`font-bold text-sm ${isDone ? 'text-green-400' : 'text-white'}`}>{act.title}</h4> 
                            <div className="flex gap-2 items-center mt-1">
                                {act.is_obligatory && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">OBLIGATOIRE</span>}
                                <span className="text-xs text-slate-500 capitalize">{act.type}</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#1A1A24]/90 backdrop-blur-xl border border-white/10 rounded-full p-2 flex justify-between items-center shadow-2xl z-50">
        <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="w-12 h-12 rounded-full flex items-center justify-center text-white"><Home size={20} /></button>
        <button onClick={() => setIsScanning(true)} className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center -mt-8 border-4 border-[#0F0F1A] shadow-lg shadow-purple-500/40 hover:scale-105 transition-transform"><ScanLine size={24} /></button>
        <button onClick={() => setShowProfile(true)} className="w-12 h-12 rounded-full flex items-center justify-center text-slate-400"><User size={20} /></button>
      </nav>

    </div>
  );
}