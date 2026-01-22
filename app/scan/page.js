// File: app/scan/page.js
'use client';
import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScannerPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render((decodedText) => {
      scanner.clear();
      setData(decodedText);
    }, (error) => {
      console.warn(error);
    });

    return () => scanner.clear().catch(e => console.error(e));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6 text-purple-400">Scanner</h1>
      
      {data ? (
        <div className="p-6 border-2 border-green-500 rounded-xl text-center bg-green-900/20">
          <h2 className="text-2xl font-bold mb-2">✅ Success!</h2>
          <p className="text-xl break-all">{data}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-6 py-2 bg-green-600 rounded-full font-bold"
          >
            Scan Again
          </button>
        </div>
      ) : (
        <div id="reader" className="w-full max-w-sm bg-white rounded-xl overflow-hidden text-black"></div>
      )}
    </div>
  );
}