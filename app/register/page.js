'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, ArrowLeft, Rocket, Loader2, AlertCircle, Sparkles } from 'lucide-react';

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
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...form })
      });
      const json = await res.json();
      
      if (json.success) {
        // Save the user info so the dashboard knows who we are
        if (json.user) {
          localStorage.setItem('user', JSON.stringify(json.user));
        }
        // Redirect immediately
        router.push('/dashboard');
      } else {
        setError(json.message || "Erreur d'inscription");
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* 🟣 FUN BACKGROUND BLOBS */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/30 rounded-full blur-[100px] animate-pulse delay-1000"></div>

      {/* Back Button */}
      <Link href="/" className="absolute top-8 left-8 text-white/50 hover:text-white flex items-center gap-2 transition-colors z-20">
        <ArrowLeft size={20} /> Retour
      </Link>

      {/* Glass Card */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-tr from-blue-500 to-purple-500 p-4 rounded-2xl mb-4 shadow-lg shadow-blue-500/20 -rotate-3 hover:rotate-6 transition-transform">
            <Rocket size={32} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-black text-white">Rejoignez la Team !</h1>
          <p className="text-slate-400 flex items-center justify-center gap-2">
            Créez votre profil FICAM <Sparkles size={14} className="text-yellow-400" />
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/20 text-red-200 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Input */}
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Ton Prénom & Nom"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              required
              className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Email Input */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input 
              type="email" 
              placeholder="Email étudiant"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              required
              className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Password Input */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors" size={20} />
            <input 
              type="password" 
              placeholder="Choisis un mot de passe"
              value={form.password}
              onChange={(e) => setForm({...form, password: e.target.value})}
              required
              minLength={6}
              className="w-full bg-black/20 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" />
                Création...
              </>
            ) : (
              "Commencer l'aventure 🚀"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm">
          Déjà un compte ? <Link href="/login" className="text-blue-400 font-bold hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}