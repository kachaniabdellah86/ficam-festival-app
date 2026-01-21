'use client';
import { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import { useRouter } from 'next/navigation';

export default function Scanner() {
  const [data, setData] = useState('');
  const [status, setStatus] = useState('Scannez un code...');
  const [step, setStep] = useState('scan'); // steps: 'scan', 'question', 'result'
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [activityName, setActivityName] = useState('');
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/login');
    setUser(JSON.parse(stored));
  }, []);

  const handleScan = async (result, error) => {
    if (!!result && step === 'scan') {
      setData(result?.text);
      setStep('loading'); 
      
      // Send QR to server to check if it exists
      const res = await fetch('/api/validate', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, qrCode: result?.text })
      });
      const json = await res.json();

      if (json.step === 'question') {
        // If valid, show the secret question
        setQuestion(json.question);
        setActivityName(json.activityName);
        setStep('question');
      } else {
        // If invalid or already scanned, show error
        setStatus(json.message);
        setStep('result');
      }
    }
  };

  const submitAnswer = async () => {
    const res = await fetch('/api/validate', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id, qrCode: data, answer: answer })
    });
    const json = await res.json();
    
    setStatus(json.message);
    setStep('result');
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      
      {/* STEP 1: CAMERA */}
      {step === 'scan' && (
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-4">Scanner d'Activité</h1>
          <div className="border-4 border-blue-500 rounded-xl overflow-hidden bg-gray-900 relative">
             {/* The QR Reader Component */}
            <QrReader
              onResult={handleScan}
              constraints={{ facingMode: 'environment' }}
              style={{ width: '100%' }}
            />
          </div>
          <p className="text-center mt-4 text-gray-400">Pointez la caméra vers un QR Code FICAM</p>
          <button onClick={() => router.push('/dashboard')} className="mt-8 w-full py-3 bg-gray-800 rounded-lg">Retour</button>
        </div>
      )}

      {/* STEP 2: SECRET QUESTION */}
      {step === 'question' && (
        <div className="bg-white text-black p-6 rounded-xl w-full max-w-md shadow-2xl">
          <h2 className="text-xl font-bold mb-2 text-blue-900">{activityName}</h2>
          <p className="text-gray-600 mb-4">Question de sécurité :</p>
          <div className="bg-yellow-100 p-4 rounded-lg mb-4 border-l-4 border-yellow-500">
            <p className="font-bold text-yellow-900">{question}</p>
          </div>
          <input 
            className="w-full p-3 border-2 mb-4 text-lg rounded" 
            placeholder="Votre réponse..." 
            value={answer} 
            onChange={(e) => setAnswer(e.target.value)} 
          />
          <button onClick={submitAnswer} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg">Valider</button>
        </div>
      )}

      {/* STEP 3: RESULT */}
      {step === 'result' && (
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">
            {status.includes('Succès') ? '✅' : '❌'}
          </div>
          <h2 className="text-2xl font-bold mb-8">{status}</h2>
          <button onClick={() => router.push('/dashboard')} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition">
            Retour au Dashboard
          </button>
        </div>
      )}
    </div>
  );
}