'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle2, Copy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TwoFactorSetupPage() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [step, setStep] = useState<'SETUP' | 'SUCCESS'>('SETUP');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/2fa')
      .then((res) => res.json())
      .then((data) => {
        if (data.qrCodeUrl) {
          setQrCodeUrl(data.qrCodeUrl);
          setSecret(data.secret);
        }
      });
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ENABLE_2FA', code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid 2FA verification code');

      setBackupCodes(data.backupCodes || []);
      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071221] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </Link>

        <div className="asf-card p-6 border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Two-Factor Authentication (2FA)</h2>
              <p className="text-xs text-slate-400">Configure TOTP authenticator app (Google Authenticator / Authy)</p>
            </div>
          </div>

          {step === 'SETUP' ? (
            <div className="space-y-5">
              {qrCodeUrl && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <img src={qrCodeUrl} alt="2FA QR Code" className="w-44 h-44 rounded-lg bg-white p-2" />
                  <p className="mt-3 text-xs text-slate-400 font-mono">Secret: {secret}</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Enter 6-Digit Authenticator Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    className="w-full tracking-widest text-center text-lg font-mono py-2 bg-slate-950 border border-slate-800 rounded-lg text-amber-400 focus:outline-none focus:border-amber-500"
                    placeholder="123456"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-amber-500/20 transition-all"
                >
                  {loading ? 'Verifying...' : 'Enable 2FA Protection'}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <p className="text-xs font-bold">2FA Enabled Successfully!</p>
                  <p className="text-[11px] text-emerald-300">Your account is now secured with TOTP multi-factor authentication.</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-200 mb-2">Emergency Backup Recovery Codes:</p>
                <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-amber-400">
                  {backupCodes.map((c, i) => (
                    <div key={i} className="px-2 py-1 bg-slate-900 rounded border border-slate-800 text-center">
                      {c}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Save these codes in a safe place. Each code can be used once if you lose your phone.</p>
              </div>

              <Link
                href="/"
                className="block text-center py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors"
              >
                Proceed to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
