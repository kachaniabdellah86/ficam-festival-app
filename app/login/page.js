'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowLeft, Zap, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- 1. INITIALIZE SUPABASE ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // --- 2. LOG IN WITH SUPABASE AUTH ---
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      // --- 3. CHECK USER ROLE IN DATABASE ---
      if (data?.user) {
        // Fetch the user's profile to get the role
        const { data: profile, error: dbError } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (dbError) {
             console.error("DB Error:", dbError);
        }

        const role = profile?.role || 'student';
        
        // Save simple user info for the UI
        localStorage.setItem('user', JSON.stringify({ 
           email: data.user.email, 
           role: role,
           id: data.user.id 
        }));

        // --- 4. REDIRECT ---
        if (role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      }

    } catch (err) {
      console.error(err);
      setError("Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIX: Added w-full max-w-[100vw] to constrain width
    <div className="min-h-screen w-full max-w-[100vw] bg-[#0F0F1A] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* FIX: Background Decor Wrapper - Fixed and Hidden to prevent scroll */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/30 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-600/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      <Link href="/" className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20">
        <ArrowLeft size={20} /> Retour
      </Link>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-tr from-purple-500 to-pink-500 p-4 rounded-2xl mb-4 shadow-lg shadow-purple-500/20 rotate-3">
            <Zap size={32} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-black text-white">Connexion</h1>
          <p className="text-slate-400">Espace {form.email.includes('admin') ? 'Administrateur' : 'Étudiant'}</p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-200 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={20} />
            <input 
              type="email" 
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" size={20} />
            <input 
              type="password" 
              placeholder="Mot de passe"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
            />
          </div>

          <button disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : "Se connecter"}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm">
          Nouveau ici ? <Link href="/register" className="text-pink-400 font-bold hover:underline">Créer un profil</Link>
        </p>
      </div>
    </div>
  );
}