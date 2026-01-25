'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, ArrowLeft, Rocket, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- 1. INITIALIZE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // --- 2. CREATE ACCOUNT IN SUPABASE AUTH ---
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name } // We save the name here
        }
      });

      if (authError) throw authError;

      // --- 3. CREATE PROFILE IN DATABASE (For Admin & XP) ---
      // We check if data.user exists before writing
      if (data?.user) {
        const { error: dbError } = await supabase.from('users').insert([
          { 
            id: data.user.id, 
            email: form.email, 
            full_name: form.name, 
            role: 'student', // Default role
            xp: 0,
            badges: [] // Initialize empty badges
          }
        ]);
        
        if (dbError) throw dbError;
      }

      // --- 4. SUCCESS & REDIRECT ---
      // Optional: Save to local storage for immediate UI access
      if (data?.user) {
        localStorage.setItem('user', JSON.stringify({ 
           email: form.email, 
           role: 'student', 
           id: data.user.id,
           name: form.name
        }));
      }

      alert("Compte créé avec succès ! 🚀");
      router.push('/dashboard');

    } catch (err) {
      console.error(err);
      setError(err.message || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // 📱 Mobile Fix: px-4 for side padding, py-12 to ensure it doesn't stick to top/bottom
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      
      {/* 🟣 Blobs adjusted for mobile opacity */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[80px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/20 rounded-full blur-[80px] animate-pulse delay-1000"></div>

      <Link href="/" className="absolute top-6 left-6 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20">
        <ArrowLeft size={20} /> <span className="hidden sm:inline">Retour</span>
      </Link>

      {/* 📱 Mobile Fix: Width full, but max width constrained */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative z-10">
        
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex bg-gradient-to-tr from-blue-500 to-purple-500 p-3 md:p-4 rounded-2xl mb-4 shadow-lg shadow-blue-500/20 -rotate-3">
            <Rocket size={28} className="text-white md:w-8 md:h-8" fill="currentColor" />
          </div>
          {/* 📱 Mobile Fix: Smaller text on phone */}
          <h1 className="text-2xl md:text-3xl font-black text-white">Rejoignez la Team !</h1>
          <p className="text-slate-400 text-sm md:text-base flex items-center justify-center gap-2 mt-2">
            Créez votre profil FICAM <Sparkles size={14} className="text-yellow-400" />
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/20 text-red-200 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400" size={20} />
            <input 
              type="text" 
              placeholder="Ton Prénom & Nom"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              required
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 md:py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm md:text-base"
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400" size={20} />
            <input 
              type="email" 
              placeholder="Email étudiant"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              required
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 md:py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm md:text-base"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400" size={20} />
            <input 
              type="password" 
              placeholder="Mot de passe"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              required
              minLength={6}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-3 md:py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm md:text-base"
            />
          </div>

          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 md:py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Commencer l'aventure 🚀"}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm">
          Déjà un compte ? <Link href="/login" className="text-blue-400 font-bold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}