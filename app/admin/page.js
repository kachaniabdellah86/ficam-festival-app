'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, LayoutGrid, QrCode, Trash2, Plus, Download, Medal } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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

  // --- FETCHERS ---
  const fetchUsers = async () => {
    try {
      // ✅ MODIF ICI : On récupère les users AVEC leurs scans et les détails de l'activité
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          scans (
            created_at,
            activities (
              id,
              title,
              type
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

  const getName = (email) => email ? email.split('@')[0] : 'Inconnu';

  // ✅ MODIF : Nouvelle fonction pour afficher les vrais badges
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
            {user.scans.map((scan, index) => {
                // Protection si l'activité a été supprimée entre temps
                if (!scan.activities) return null;

                const isMatin = scan.activities.type === 'matin';
                return (
                    <span key={index} className={`
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
    <div className="min-h-screen bg-[#0a0a12] text-white font-sans flex flex-col md:flex-row">
      
      {/* 🔵 SIDEBAR */}
      <aside className="w-full md:w-64 bg-[#11111a] border-b md:border-b-0 md:border-r border-white/5 flex flex-col p-4 md:p-6">
        <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600/20 p-2 rounded-lg">
                <Shield className="text-blue-500" size={24} />
            </div>
            <div>
                <div className="font-bold text-lg">Admin OS</div>
                <div className="text-[10px] text-blue-500/80 font-mono tracking-widest">v3.0 DB</div>
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
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-1">Utilisateurs</h1>
                    <p className="text-slate-400 text-sm">Suivi des présences et des badges obtenus.</p>
                </header>

                <div className="bg-[#11111a] border border-white/5 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 text-slate-400 text-sm">
                            <tr>
                                <th className="p-4 w-1/4">Utilisateur</th>
                                <th className="p-4 w-1/2">Badges Validés</th>
                                <th className="p-4 w-1/4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {allUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="p-8 text-center text-slate-500">
                                        Aucun utilisateur trouvé...
                                    </td>
                                </tr>
                            ) : (
                                allUsers.map((u, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                                                {u.email ? u.email.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <span className="font-medium text-white">{getName(u.email)}</span>
                                        </td>
                                        
                                        {/* ✅ MODIF : APPEL DE LA FONCTION RENDER BADGES */}
                                        <td className="p-4">
                                            {renderBadges(u)}
                                        </td>

                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => generateCertificate(getName(u.email), new Date().toLocaleDateString())}
                                                className="ml-auto bg-blue-600/20 text-blue-400 border border-blue-600/50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 w-fit"
                                            >
                                                <Download size={14} /> Attestation
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
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
                                <div className="bg-white p-2 rounded-lg shrink-0">
                                    <QRCodeSVG value={act.qr_code} size={80} />
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
                                <button 
                                    onClick={() => handleDeleteActivity(act.id)}
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