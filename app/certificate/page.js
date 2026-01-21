'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Certificate() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
      setLoading(false);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="bg-slate-900 min-h-screen"></div>;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      
      {/* NAVIGATION (Hidden when printing) */}
      <div className="w-full max-w-4xl mb-6 flex justify-between items-center print:hidden">
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-slate-400 hover:text-white flex items-center gap-2">
          ← Retour au Dashboard
        </button>
        <button 
          onClick={handlePrint}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all">
          🖨️ Imprimer / PDF
        </button>
      </div>

      {/* CERTIFICATE PAPER */}
      <div className="bg-white text-black w-full max-w-[297mm] aspect-[1.414/1] md:aspect-[1.414/1] shadow-2xl p-10 md:p-20 relative overflow-hidden print:shadow-none print:w-full print:h-screen print:m-0 print:p-0">
        
        {/* WATERMARK BACKGROUND */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <h1 className="text-[200px] font-black uppercase rotate-[-45deg]">FICAM</h1>
        </div>

        {/* BORDER FRAME */}
        <div className="absolute inset-4 border-[10px] border-double border-slate-900 pointer-events-none"></div>
        <div className="absolute inset-2 border border-slate-300 pointer-events-none"></div>

        {/* CONTENT */}
        <div className="h-full flex flex-col items-center justify-between text-center relative z-10 py-10">
            
            {/* HEADER */}
            <div className="w-full">
                <div className="flex justify-between items-center px-12 mb-8">
                    {/* Placeholder Logos */}
                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-xs text-gray-500">Logo FICAM</div>
                    <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-xs text-gray-500">Logo École</div>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold uppercase tracking-widest mb-2 text-slate-900">
                    Attestation de Participation
                </h1>
                <p className="text-slate-500 uppercase tracking-[0.3em] text-sm">Festival International de Cinéma d'Animation de Meknès</p>
            </div>

            {/* BODY */}
            <div className="my-8">
                <p className="text-xl text-slate-600 italic mb-6">Nous certifions par la présente que</p>
                
                <h2 className="text-4xl md:text-6xl font-cursive text-purple-700 mb-6 font-bold py-4 border-b-2 border-slate-200 inline-block px-10 min-w-[50%]">
                    {user?.name || "Nom de l'étudiant"}
                </h2>

                <p className="text-lg text-slate-700 leading-relaxed max-w-2xl mx-auto mt-4">
                    a validé avec succès le <strong>Parcours Étudiant</strong> lors de l'édition 2026, 
                    en participant assidûment aux masterclass, projections et ateliers de formation.
                </p>
            </div>

            {/* FOOTER */}
            <div className="w-full flex justify-between items-end px-16 mt-12">
                <div className="text-center">
                    <p className="text-sm text-slate-400 mb-8">Fait à Meknès, le 21 Mars 2026</p>
                    <div className="h-0.5 w-40 bg-slate-900 mx-auto mb-2"></div>
                    <p className="font-bold text-sm uppercase">Direction du Festival</p>
                </div>
                
                {/* QR CODE FOR VALIDATION (Fake for now) */}
                <div className="text-center">
                     <div className="w-24 h-24 bg-black mx-auto mb-2 text-white flex items-center justify-center text-xs p-1">
                        QR Sécurisé
                     </div>
                     <p className="text-[10px] text-slate-400 font-mono">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}