'use client';
import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';
import Link from 'next/link';

export default function ScanPage() {
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scanner.render((decodedText) => {
      setScanResult(decodedText);
      scanner.clear();
    }, (error) => {
      // ignore errors
    });

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">Scanner</h1>
          <Link href="/" className="p-2 bg-gray-800 rounded-full">
            <X className="w-6 h-6" />
          </Link>
        </div>

        {scanResult ? (
          <div className="bg-green-600 p-6 rounded-xl text-center">
            <h2 className="text-2xl font-bold mb-2">Success!</h2>
            <p className="text-lg">{scanResult}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-6 py-2 bg-white text-green-900 font-bold rounded-full"
            >
              Scan Again
            </button>
          </div>
        ) : (
          <div className="bg-white/10 p-4 rounded-xl">
            <div id="reader" className="overflow-hidden rounded-lg"></div>
          </div>
        )}
      </div>
    </div>
  );
}