'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Users, LayoutGrid, QrCode, Trash2, Plus, 
  Download, Medal, Eye, X, Clock, Search, Loader2, Edit, CheckCircle, Trophy, Activity 
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { generateCertificate } from '@/app/utils/generatePdf';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { Toaster, toast } from 'sonner'; // ✨ NEW: Import Toast

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminDashboard() {
  const router = useRouter();
    
  // Auth & UI State
  const [admin, setAdmin] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
    
  // Data State
  const [allUsers, setAllUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
    
  // Form State
  const [activityLoading, setActivityLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false); 
  const [editId, setEditId] = useState(null); 
  const [manualAssignLoading, setManualAssignLoading] = useState(false);
  
  // State for the manual assignment dropdown
  const [manualActivityId, setManualActivityId] = useState(''); 
  
  const [newActivity, setNewActivity] = useState({ 
    title: '', 
    description: '', 
    qr_code: '', 
    type: 'matin', 
    question_text: '',
    correct_answer: ''
  });

  // --- 1. AUTH & INITIALIZATION ---
  useEffect(() => {
    const checkAuth = async () => {
      const stored = localStorage.getItem('user');
      if (!stored) { router.push('/login'); return; }
        
      try {
        const user = JSON.parse(stored);
        if (user.role !== 'admin' && user.email !== 'admin@test.com') {
          router.push('/dashboard'); 
          return;
        }
        setAdmin(user);
        await Promise.all([fetchUsers(), fetchActivities()]);
      } catch (e) {
        console.error("Auth Error", e);
        router.push('/login');
      } finally {
        setInitialLoading(false);
      }
    };

    checkAuth();

    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedUser(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [router]);

  // --- 2. SUPABASE REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (!admin) return;

    const channel = supabase
      .channel('realtime-activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_activities' },
        () => fetchUsers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [admin]);

  // --- 3. FETCHERS ---
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_activities!fk_user_activities_user (
            id,
            created_at,
            activities!fk_user_activities_activities ( 
              id, 
              title, 
              type, 
              description 
            )
          )
        `)
        .order('email', { ascending: true });

      if (error) throw error;
      setAllUsers(data || []);
      
      if (selectedUser) {
        const updatedUser = data.find(u => u.id === selectedUser.id);
        if (updatedUser) setSelectedUser(updatedUser);
      }
    } catch (error) { 
        console.error("Failed to fetch users", error.message); 
        toast.error("Erreur de chargement des utilisateurs");
    }
  };

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
        console.error("Error fetching activities:", error.message);
    }
  };

  // --- 4. ACTIONS (ACTIVITIES) ---
  const downloadQR = (activity) => {
    const canvas = document.getElementById(`qr-canvas-${activity.id}`);
    if (canvas) {
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `QR_${activity.title.replace(/\s+/g, '_')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast.success("QR Code téléchargé !");
    }
  };

  const handleEditClick = (activity) => {
    setNewActivity({
        title: activity.title,
        description: activity.description,
        qr_code: activity.qr_code,
        type: activity.type,
        question_text: activity.question_text || '',
        correct_answer: activity.correct_answer || ''
    });
    setEditId(activity.id);
    setIsEditing(true);
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveActivity = async () => {
    if (!newActivity.title || !newActivity.qr_code) return toast.error("Titre et Code QR requis !");
    
    setActivityLoading(true);
    let error;

    if (isEditing) {
        const { error: updateError } = await supabase
            .from('activities')
            .update({
                title: newActivity.title,
                description: newActivity.description,
                qr_code: newActivity.qr_code,
                type: newActivity.type,
                question_text: newActivity.question_text,
                correct_answer: newActivity.correct_answer
            })
            .eq('id', editId);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('activities').insert([{
            title: newActivity.title,
            description: newActivity.description,
            qr_code: newActivity.qr_code,
            type: newActivity.type,
            points: 10,
            question_text: newActivity.question_text,
            correct_answer: newActivity.correct_answer
        }]);
        error = insertError;
    }

    setActivityLoading(false);

    if (error) {
      toast.error("Erreur lors de la sauvegarde.");
    } else {
      resetForm();
      fetchActivities(); 
      toast.success(isEditing ? "Activité modifiée !" : "Nouvelle activité créée !");
    }
  };

  const resetForm = () => {
    setNewActivity({ 
        title: '', description: '', qr_code: '', type: 'matin', question_text: '', correct_answer: '' 
    });
    setIsEditing(false);
    setEditId(null);
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm("Supprimer cette activité ?")) return;
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) toast.error("Impossible : des utilisateurs l'ont peut-être déjà scannée.");
    else {
        fetchActivities();
        toast.success("Activité supprimée");
    }
  };

  // --- 5. ACTIONS (MANUAL ASSIGN) ---
  const handleManualAssign = async () => {
    if(!selectedUser || !manualActivityId) return;
    
    setManualAssignLoading(true);

    const alreadyExists = selectedUser.user_activities?.some(ua => ua.activities?.id === manualActivityId);
    if(alreadyExists) {
        setManualAssignLoading(false);
        return toast.warning("L'utilisateur a déjà ce badge.");
    }

    const { error } = await supabase.from('user_activities').insert([
        {
            user_id: selectedUser.id,
            activity_id: manualActivityId,
            score: 10
        }
    ]);

    if(error) {
        toast.error("Erreur lors de l'attribution.");
        console.error(error);
    } else {
        await fetchUsers(); 
        setManualActivityId('');
        toast.success("Badge attribué manuellement !");
    }
    setManualAssignLoading(false);
  };

  // --- 6. EXCEL EXPORT ---
  const handleExportExcel = () => {
    const dataToExport = allUsers.map(user => {
        const activityList = user.user_activities && user.user_activities.length > 0
            ? user.user_activities
                .map(ua => ua.activities ? ua.activities.title : '(Supprimé)')
                .join(', ')
            : 'Aucune';
        
        return {
            "ID": user.id,
            "Email": user.email,
            "Nom": getName(user.email),
            "Badges": user.user_activities?.length || 0,
            "Détails": activityList,
            "Date": new Date(user.created_at).toLocaleDateString('fr-FR')
        };
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const wscols = [{ wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 50 }, { wch: 15 }];
    worksheet['!cols'] = wscols;
    XLSX.utils.book_append_sheet(workbook, worksheet, "Participants");
    XLSX.writeFile(workbook, `Export_Participants_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
    toast.success("Export Excel généré !");
  };

  // Utilities
  const getName = (email) => email ? email.split('@')[0] : 'Inconnu';
  
  const filteredUsers = allUsers.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    getName(u.email).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnearnedActivities = (user) => {
    if (!user) return [];
    const earnedIds = user.user_activities?.map(ua => ua.activities?.id) || [];
    return activities.filter(act => !earnedIds.includes(act.id));
  };

  const renderBadges = (user) => {
    if (!user.user_activities || user.user_activities.length === 0) {
        return <div className="flex items-center gap-1 opacity-50 text-xs text-slate-500 italic"><Medal size={12}/> Aucun badge</div>;
    }
    return (
        <div className="flex flex-wrap gap-2">
            {user.user_activities.map((item) => {
                const activityTitle = item.activities?.title || 'Supprimé';
                const isMatin = item.activities?.type === 'matin';
                return (
                    <span key={item.id} className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase font-bold border ${isMatin ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                        {isMatin ? '🌞' : '🎬'} {activityTitle}
                    </span>
                );
            })}
        </div>
    );
  };

  if (initialLoading) return <div className="min-h-screen bg-[#0a0a12] flex items-center justify-center text-white"><Loader2 className="animate-spin text-blue-500" size={48} /></div>;
  if (!admin) return null;

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#0a0a12] text-white font-sans flex flex-col md:flex-row relative overflow-hidden">
      
      {/* ✨ BACKGROUND BLOBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      {/* ✨ SIDEBAR: Added backdrop-blur for glass effect */}
      <aside className="w-full md:w-64 bg-[#11111a]/90 backdrop-blur-md border-b md:border-r border-white/5 flex flex-col p-4 md:p-6 shrink-0 z-20 relative">
        <div className="flex items-center gap-3 mb-6 md:mb-10">
            <div className="bg-blue-600/20 p-2 rounded-lg"><Shield className="text-blue-500" size={24} /></div>
            <div>
                <div className="font-bold text-lg">Admin OS</div>
                <div className="text-[10px] text-blue-500/80 font-mono tracking-widest">v5.2 Platinum</div>
            </div>
        </div>

        <nav className="grid grid-cols-2 md:flex md:flex-col gap-2">
          <button onClick={() => setActiveTab('users')} className={`col-span-1 p-3 rounded-lg flex items-center justify-center md:justify-start gap-2 md:gap-3 font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <Users size={18} /> <span className="text-sm md:text-base">Utilisateurs</span>
          </button>
          
          <button onClick={() => setActiveTab('steps')} className={`col-span-1 p-3 rounded-lg flex items-center justify-center md:justify-start gap-2 md:gap-3 font-medium transition-colors ${activeTab === 'steps' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/5'}`}>
            <QrCode size={18} /> <span className="text-sm md:text-base">Activités</span>
          </button>
          
          <div onClick={() => router.push('/dashboard')} className="col-span-2 md:mt-auto border-t border-white/10 pt-3 md:pt-4 text-slate-400 p-3 rounded-lg flex items-center justify-center md:justify-start gap-3 font-medium hover:text-purple-400 cursor-pointer bg-white/5 md:bg-transparent mt-2 md:mt-0">
            <LayoutGrid size={18} /> Retour au Jeu
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main id="main-content" className="flex-1 p-4 md:p-10 overflow-y-auto h-[calc(100vh-theme(spacing.48))] md:h-screen z-10 relative">
        
        {activeTab === 'users' && (
            <>
                <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Tableau de Bord</h1>
                        <p className="text-slate-400 text-sm">Vue d'ensemble des participants et progression.</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold text-sm shadow-lg shadow-green-900/20">
                            <Download size={18} /> Excel
                        </button>
                        <div className="relative flex-1 md:flex-none">
                            <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-[#1a1a24]/80 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white w-full md:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                        </div>
                    </div>
                </header>

                {/* ✨ NEW: GLOBAL STATS OVERVIEW CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/20 p-4 rounded-xl backdrop-blur-md">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Total Participants</div>
                        <Users size={16} className="text-blue-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{allUsers.length}</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-600/20 to-purple-900/10 border border-purple-500/20 p-4 rounded-xl backdrop-blur-md">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Badges Validés</div>
                        <Medal size={16} className="text-purple-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {allUsers.reduce((acc, user) => acc + (user.user_activities?.length || 0), 0)}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-600/20 to-orange-900/10 border border-yellow-500/20 p-4 rounded-xl backdrop-blur-md">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Activités Totales</div>
                        <Activity size={16} className="text-yellow-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">{activities.length}</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-600/20 to-emerald-900/10 border border-green-500/20 p-4 rounded-xl backdrop-blur-md">
                    <div className="flex justify-between items-start mb-2">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Taux Complétion</div>
                        <Trophy size={16} className="text-green-400" />
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {allUsers.length > 0 && activities.length > 0
                        ? Math.round((allUsers.filter(u => u.user_activities?.length === activities.length).length / allUsers.length) * 100) 
                        : 0}%
                    </div>
                  </div>
                </div>

                {/* ✨ TABLE: Added Glassmorphism */}
                <div className="bg-[#11111a]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-white/5 text-slate-400 text-sm">
                                <tr>
                                    <th className="p-4 w-1/4">Utilisateur</th>
                                    <th className="p-4 w-1/2">Badges Validés</th>
                                    <th className="p-4 w-1/4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-lg group-hover:bg-blue-600 transition-colors">
                                                {u.email ? u.email.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <span className="font-medium text-white truncate">{getName(u.email)}</span>
                                        </td>
                                        <td className="p-4">{renderBadges(u)}</td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => setSelectedUser(u)} className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-colors">
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {/* ✨ NEW: Better Empty State */}
                                {filteredUsers.length === 0 && (
                                  <tr>
                                    <td colSpan={3} className="p-12 text-center">
                                      <div className="flex flex-col items-center justify-center opacity-40">
                                        <div className="bg-slate-800 p-4 rounded-full mb-3">
                                            <Users size={32} className="text-slate-400" />
                                        </div>
                                        <p className="text-slate-300 font-medium">Aucun participant trouvé</p>
                                        <p className="text-xs text-slate-500 mt-1">Essayez une autre recherche ou invitez des joueurs.</p>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        )}

        {activeTab === 'steps' && (
            <>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-1">Gestion du Parcours</h1>
                    <p className="text-slate-400 text-sm">Création, édition et suppression des ateliers.</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                        {/* ✨ FORM: Added Glassmorphism */}
                        <div className="bg-[#11111a]/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 sticky top-6 shadow-xl">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                {isEditing ? <Edit size={18} className="text-yellow-500"/> : <Plus size={18} className="text-blue-500"/>} 
                                {isEditing ? 'Modifier Activité' : 'Nouvelle Activité'}
                            </h3>
                            
                            <div className="space-y-4">
                                <select className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" value={newActivity.type} onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}>
                                    <option value="matin">🌞 Matin (Atelier)</option>
                                    <option value="apres_midi">🎬 Après-midi (Film)</option>
                                </select>
                                <input type="text" placeholder="Titre (Ex: Atelier 3D)" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" value={newActivity.title} onChange={(e) => setNewActivity({...newActivity, title: e.target.value})} />
                                <input type="text" placeholder="Description (Lieu)" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" value={newActivity.description} onChange={(e) => setNewActivity({...newActivity, description: e.target.value})} />
                                <input type="text" placeholder="Question Quiz" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none" value={newActivity.question_text} onChange={(e) => setNewActivity({...newActivity, question_text: e.target.value})} />
                                <input type="text" placeholder="Réponse Attendue" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-green-500/50 outline-none" value={newActivity.correct_answer} onChange={(e) => setNewActivity({...newActivity, correct_answer: e.target.value})} />
                                <input type="text" placeholder="Code Secret QR" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white font-mono focus:ring-2 focus:ring-purple-500 outline-none" value={newActivity.qr_code} onChange={(e) => setNewActivity({...newActivity, qr_code: e.target.value})} />
                                
                                <div className="flex gap-2">
                                    {isEditing && (
                                        <button onClick={resetForm} className="px-4 py-3 rounded-lg bg-slate-700 text-white text-sm font-bold hover:bg-slate-600">Annuler</button>
                                    )}
                                    <button 
                                        onClick={handleSaveActivity} 
                                        disabled={activityLoading}
                                        className={`flex-1 font-bold py-3 rounded-lg flex justify-center items-center transition-all ${isEditing ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'}`}
                                    >
                                        {activityLoading ? <Loader2 className="animate-spin" size={20}/> : (isEditing ? "Enregistrer" : "Créer")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 grid gap-4 content-start">
                        {activities.map((act) => (
                            // ✨ CARD: Added Glassmorphism
                            <div key={act.id} className={`bg-[#11111a]/60 backdrop-blur-md p-4 rounded-2xl border flex items-center gap-6 group transition-all ${editId === act.id ? 'border-yellow-500/50 bg-yellow-500/10' : 'border-white/5 hover:border-white/20'}`}>
                                <div className="bg-white p-2 rounded-lg shrink-0 hidden sm:block">
                                    <QRCodeCanvas id={`qr-canvas-${act.id}`} value={act.qr_code} size={80} level={"H"} includeMargin={true}/>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg">{act.title}</h3>
                                        <span className={`text-[10px] px-2 py-1 rounded uppercase font-bold ${act.type==='matin' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-purple-500/20 text-purple-500'}`}>{act.type==='matin'?'Matin':'Aprèm'}</span>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-1">{act.description}</p>
                                    <div className="text-xs text-slate-500 italic mb-2">Q: {act.question_text} | R: {act.correct_answer}</div>
                                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded font-mono">Code: {act.qr_code}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => downloadQR(act)} title="Télécharger QR" className="p-2 text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg"><Download size={20} /></button>
                                    <button onClick={() => handleEditClick(act)} title="Modifier" className="p-2 text-slate-600 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg"><Edit size={20} /></button>
                                    <button onClick={() => handleDeleteActivity(act.id)} title="Supprimer" className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={20} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>
        )}
      </main>

      {/* USER DETAIL MODAL - ✨ Glassmorphism */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
            <div className="bg-[#1a1a24]/95 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{getName(selectedUser.email)}</h2>
                        <p className="text-slate-400 text-xs font-mono">{selectedUser.email}</p>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-blue-400 mb-1">{selectedUser.user_activities?.length || 0}</div>
                            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Activités Validées</div>
                        </div>
                        <button onClick={() => generateCertificate(getName(selectedUser.email), new Date().toLocaleDateString())} className="bg-green-600/10 border border-green-500/20 hover:bg-green-600/20 hover:text-green-400 text-green-500 p-4 rounded-xl flex flex-col items-center justify-center transition-all gap-2">
                            <Download size={24} />
                            <span className="text-xs font-bold uppercase">Attestation PDF</span>
                        </button>
                    </div>

                    <div className="mb-8 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-3 flex items-center gap-2"><Plus size={12}/> Attribution Manuelle</h4>
                        {getUnearnedActivities(selectedUser).length > 0 ? (
                            <div className="flex gap-2">
                                <select 
                                    className="bg-black/30 text-white text-sm rounded-lg px-3 py-2 flex-1 border border-white/10 outline-none focus:border-blue-500"
                                    value={manualActivityId}
                                    onChange={(e) => setManualActivityId(e.target.value)}
                                >
                                    <option value="">-- Choisir une activité --</option>
                                    {getUnearnedActivities(selectedUser).map(act => (
                                        <option key={act.id} value={act.id}>{act.title} ({act.type})</option>
                                    ))}
                                </select>
                                <button 
                                    onClick={handleManualAssign}
                                    disabled={manualAssignLoading || !manualActivityId}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {manualAssignLoading ? <Loader2 className="animate-spin" size={16}/> : 'Ajouter'}
                                </button>
                            </div>
                        ) : (
                            <div className="text-green-400 text-sm flex items-center gap-2"><CheckCircle size={16}/> Cet utilisateur a validé toutes les activités !</div>
                        )}
                    </div>

                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white"><Clock size={18} className="text-purple-400"/> Historique</h3>
                    <div className="space-y-0 relative border-l border-white/10 ml-2 pl-6 pb-2">
                        {(!selectedUser.user_activities || selectedUser.user_activities.length === 0) ? (
                            <div className="text-slate-500 italic py-4">Aucune activité pour le moment.</div> 
                        ) : (
                            [...selectedUser.user_activities]
                                .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
                                .map((item) => (
                                    <div key={item.id} className="relative mb-6 last:mb-0 group">
                                        <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${item.activities?.type==='matin'?'bg-yellow-500 border-[#1a1a24]':'bg-purple-500 border-[#1a1a24]'}`}></div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 group-hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.activities?.type==='matin'?'bg-yellow-500/20 text-yellow-500':'bg-purple-500/20 text-purple-400'}`}>{item.activities?.type==='matin'?'Atelier':'Film'}</span>
                                                <span className="text-xs text-slate-500 font-mono">{new Date(item.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                                            </div>
                                            <div className="font-bold text-white text-lg">{item.activities?.title || '(Activité Supprimée)'}</div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}