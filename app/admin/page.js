'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Users, LayoutGrid, QrCode, Trash2, Plus, 
  Download, Medal, Eye, X, Clock, Calendar, Search 
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { generateCertificate } from '@/app/utils/generatePdf';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [allUsers, setAllUsers] = useState([]);
  
  // ✅ NEW: Search State
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ NEW: State for the specific student we are inspecting
  const [selectedUser, setSelectedUser] = useState(null);
  
  // --- Activities State ---
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [newActivity, setNewActivity] = useState({ 
    title: '', 
    description: '', 
    qr_code: '', 
    type: 'matin', 
    question_text: '',
    correct_answer: ''
  });

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    
    const user = JSON.parse(stored);
    // Simple client-side role check (Security should also be enforced by RLS in Supabase)
    if (user.role !== 'admin' && user.email !== 'admin@test.com') {
      router.push('/dashboard'); 
      return;
    }
    setAdmin(user);

    fetchUsers();
    fetchActivities();

    const interval = setInterval(fetchUsers, 5000); 
    return () => clearInterval(interval);
  }, [router]);

  // ✅ UX: Handle "Escape" key to close modal
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') setSelectedUser(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // --- FETCHERS ---
  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          scans (
            id,
            created_at,
            activities (
              id,
              title,
              type,
              description
            )
          )
        `)
        .order('email', { ascending: true });

      if (error) {
        console.error("Erreur Supabase (Users):", error.message);
      } else {
        setAllUsers(data || []);
      }
    } catch (error) { console.error("Failed to fetch users", error); }
  };

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) console.error("Error fetching activities:", error);
    else setActivities(data || []);
    setLoading(false);
  };

  // --- ACTIONS ---
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
    } else {
        alert("Erreur: Impossible de générer l'image.");
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.title || !newActivity.qr_code) return alert("Titre et Code QR requis !");
    if (!newActivity.question_text || !newActivity.correct_answer) return alert("Question et Réponse requises !");

    const { error } = await supabase.from('activities').insert([
      {
        title: newActivity.title,
        description: newActivity.description,
        qr_code: newActivity.qr_code,
        type: newActivity.type,
        points: 0,
        question_text: newActivity.question_text,
        correct_answer: newActivity.correct_answer
      }
    ]);

    if (error) {
      console.error(error);
      alert("Erreur: Le code QR existe peut-être déjà ou erreur serveur.");
    } else {
      setNewActivity({ 
          title: '', 
          description: '', 
          qr_code: '', 
          type: 'matin', 
          question_text: '',
          correct_answer: ''
      });
      fetchActivities(); 
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!confirm("Supprimer cette activité ?")) return;
    const { error } = await supabase.from('activities').delete().eq('id', id);
    if (error) alert("Erreur lors de la suppression");
    else fetchActivities();
  };

  // Helper Functions
  const getName = (email) => email ? email.split('@')[0] : 'Inconnu';
  
  // ✅ Filter Users based on Search
  const filteredUsers = allUsers.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    getName(u.email).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderBadges = (user) => {
    if (!user.scans || user.scans.length === 0) {
        return (
            <div className="flex items-center gap-1 opacity-50 text-xs text-slate-500 italic">
                <Medal size={12}/> Aucun badge
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2">
            {user.scans.map((scan) => {
                if (!scan.activities) return null;
                const isMatin = scan.activities.type === 'matin';
                return (
                    <span key={scan.id || Math.random()} className={`
                        flex items-center gap-1 px-2 py-1 rounded-md text-[10px] uppercase font-bold border
                        ${isMatin 
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}
                    `}>
                        {isMatin ? '🌞' : '🎬'} {scan.activities.title}
                    </span>
                );
            })}
        </div>
    );
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white font-sans flex flex-col md:flex-row relative">
      
      {/* 🔵 SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#11111a] border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-4 md:p-6">
        <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600/20 p-2 rounded-lg">
                <Shield className="text-blue-500" size={24} />
            </div>
            <div>
                <div className="font-bold text-lg">Admin OS</div>
                <div className="text-[10px] text-blue-500/80 font-mono tracking-widest">v3.1 DB</div>
            </div>
        </div>

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
            <QrCode size={18} /> Activités & QR
          </button>
          
          <div onClick={() => router.push('/dashboard')} className="md:mt-auto border-t md:border-white/10 md:pt-4 text-slate-400 p-3 rounded-lg flex items-center gap-3 font-medium hover:text-purple-400 cursor-pointer">
            <LayoutGrid size={18} /> Retour au Jeu
          </div>
        </nav>
      </aside>

      {/* 🔵 MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        
        {/* === USERS TAB === */}
        {activeTab === 'users' && (
            <>
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Utilisateurs</h1>
                        <p className="text-slate-400 text-sm">Suivi des présences et des badges obtenus.</p>
                    </div>
                    
                    {/* ✅ Search Bar */}
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Rechercher un utilisateur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-[#1a1a24] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:border-blue-500 outline-none w-full md:w-64"
                        />
                        <Search size={16} className="absolute left-3 top-2.5 text-slate-500" />
                    </div>
                </header>

                <div className="bg-[#11111a] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-white/5 text-slate-400 text-sm">
                                <tr>
                                    <th className="p-4 w-1/4">Utilisateur</th>
                                    <th className="p-4 w-1/2">Badges Validés</th>
                                    <th className="p-4 w-1/4 text-right">Détails</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-sm">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-slate-500">
                                            {searchTerm ? "Aucun résultat pour cette recherche." : "Aucun utilisateur trouvé..."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u, i) => (
                                        <tr key={u.id || i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                                                    {u.email ? u.email.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <span className="font-medium text-white truncate">{getName(u.email)}</span>
                                            </td>
                                            
                                            <td className="p-4">
                                                {renderBadges(u)}
                                            </td>

                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedUser(u)}
                                                    className="bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white p-2 rounded-lg transition-colors"
                                                    title="Inspecter"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </>
        )}

        {/* === ACTIVITIES TAB === */}
        {activeTab === 'steps' && (
            <>
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-1">Gestion du Parcours</h1>
                    <p className="text-slate-400 text-sm">Ajoutez des ateliers (Matin) ou des films (Après-midi).</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* ADD FORM */}
                    <div className="lg:col-span-1">
                        <div className="bg-[#11111a] p-6 rounded-2xl border border-white/5 sticky top-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Plus size={18}/> Nouvelle Activité</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Type</label>
                                    <select 
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white mt-1"
                                        value={newActivity.type}
                                        onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                                    >
                                        <option value="matin">🌞 Matin (Atelier Obligatoire)</option>
                                        <option value="apres_midi">🎬 Après-midi (Choix)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Titre</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Atelier 3D"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white mt-1"
                                        value={newActivity.title}
                                        onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                                    />
                                </div>
                                {/* ... Other inputs remain similar ... */}
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Description</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Salle 104"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white mt-1"
                                        value={newActivity.description}
                                        onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Question de validation</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Quelle est la couleur du logo ?"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white mt-1"
                                        value={newActivity.question_text}
                                        onChange={(e) => setNewActivity({...newActivity, question_text: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Réponse Attendue</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Rouge"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-green-500 outline-none text-white mt-1"
                                        value={newActivity.correct_answer}
                                        onChange={(e) => setNewActivity({...newActivity, correct_answer: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-slate-500 uppercase font-bold">Code QR (Secret)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: FICAM-JOUR1-MATIN"
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-blue-500 outline-none text-white mt-1"
                                        value={newActivity.qr_code}
                                        onChange={(e) => setNewActivity({...newActivity, qr_code: e.target.value})}
                                    />
                                </div>
                                <button 
                                    onClick={handleAddActivity}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all"
                                >
                                    {loading ? "Chargement..." : "Créer l'activité"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* LIST */}
                    <div className="lg:col-span-2 grid gap-4">
                        {activities.length === 0 && (
                            <div className="text-slate-500 text-center py-10">Aucune activité trouvée. Ajoutez-en une !</div>
                        )}
                        {activities.map((act) => (
                            <div key={act.id} className="bg-[#11111a] p-4 rounded-2xl border border-white/5 flex items-center gap-6 group hover:border-white/10 transition-all">
                                
                                <div className="bg-white p-2 rounded-lg shrink-0 flex items-center justify-center">
                                    <QRCodeCanvas 
                                        id={`qr-canvas-${act.id}`} 
                                        value={act.qr_code} 
                                        size={80}
                                        level={"H"}
                                        includeMargin={true}
                                    />
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-lg">{act.title}</h3>
                                        {act.type === 'matin' ? (
                                            <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded uppercase font-bold">🌞 Matin</span>
                                        ) : (
                                            <span className="text-[10px] bg-purple-500/20 text-purple-500 px-2 py-1 rounded uppercase font-bold">🎬 Aprèm</span>
                                        )}
                                    </div>
                                    <p className="text-slate-400 text-sm mb-1">{act.description}</p>
                                    
                                    <div className="text-xs text-slate-500 italic mb-2">
                                        Q: {act.question_text || "Aucune"} | R: {act.correct_answer || "Aucune"}
                                    </div>

                                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded font-mono">
                                        QR: {act.qr_code}
                                    </span>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => downloadQR(act)}
                                        className="p-3 text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                                        title="Télécharger QR"
                                    >
                                        <Download size={20} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteActivity(act.id)}
                                        className="p-3 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            </>
        )}

      </main>

      {/* ✅✅✅ MODAL: STUDENT INSPECTOR ✅✅✅ */}
      {selectedUser && (
        <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)} // Click outside closes modal
        >
            <div 
                className="bg-[#1a1a24] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()} // Click inside prevents closing
            >
                
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{getName(selectedUser.email)}</h2>
                        <p className="text-slate-400 text-xs font-mono">{selectedUser.email}</p>
                    </div>
                    <button 
                        onClick={() => setSelectedUser(null)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    
                    {/* Stats & Certificate */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center">
                            <div className="text-3xl font-bold text-blue-400 mb-1">
                                {selectedUser.scans ? selectedUser.scans.length : 0}
                            </div>
                            <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Activités Validées</div>
                        </div>
                        <button
                            onClick={() => generateCertificate(getName(selectedUser.email), new Date().toLocaleDateString())}
                            className="bg-green-600/10 border border-green-500/20 hover:bg-green-600/20 hover:text-green-400 text-green-500 p-4 rounded-xl flex flex-col items-center justify-center transition-all gap-2"
                        >
                            <Download size={24} />
                            <span className="text-xs font-bold uppercase">Attestation PDF</span>
                        </button>
                    </div>

                    {/* Timeline */}
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                        <Clock size={18} className="text-purple-400"/> Historique d'activité
                    </h3>

                    <div className="space-y-0 relative border-l border-white/10 ml-2 pl-6 pb-2">
                        {(!selectedUser.scans || selectedUser.scans.length === 0) ? (
                            <div className="text-slate-500 italic py-4">Aucune activité enregistrée.</div>
                        ) : (
                            selectedUser.scans
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Sort: Newest first
                            .map((scan, index) => {
                                // Defensive programming: handle deleted activities
                                const activityTitle = scan.activities?.title || 'Activité inconnue (Supprimée)';
                                const activityType = scan.activities?.type || 'unknown';
                                const dateObj = new Date(scan.created_at);
                                
                                return (
                                    <div key={scan.id || index} className="relative mb-6 last:mb-0">
                                        {/* Dot on timeline */}
                                        <div className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 ${activityType === 'matin' ? 'bg-yellow-500 border-[#1a1a24]' : 'bg-purple-500 border-[#1a1a24]'}`}></div>
                                        
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${activityType === 'matin' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-purple-500/20 text-purple-400'}`}>
                                                    {activityType === 'matin' ? 'Atelier' : (activityType === 'unknown' ? '?' : 'Film')}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                                    {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    <Calendar size={10} />
                                                    {dateObj.toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="font-bold text-white text-lg">{activityTitle}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                </div>
            </div>
        </div>
      )}

    </div>
  );
}