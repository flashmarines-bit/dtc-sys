'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Loader2, FileText, ArrowLeft, KeyRound, CheckCircle, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new link.');
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: password });
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#eaecf2', backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230d1b2a' fill-opacity='0.04'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E\")", display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        .rp-card { width:100%; max-width:460px; background:white; border-radius:22px; padding:48px; box-shadow:0 28px 72px rgba(13,27,42,0.14),0 4px 20px rgba(13,27,42,0.07); animation:cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .rp-input { width:100%; height:50px; padding:0 42px 0 16px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:14px; font-family:'DM Sans',sans-serif; color:#0d1b2a; background:#f5f7fa; outline:none; transition:border-color 0.2s,box-shadow 0.2s,background 0.2s; box-sizing:border-box; }
        .rp-input:focus { border-color:#1d4ed8; background:white; box-shadow:0 0 0 3px rgba(29,78,216,0.1); }
        .rp-btn { width:100%; height:50px; background:#0d1b2a; color:#e8edf5; border:none; border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; font-weight:600; letter-spacing:1px; cursor:pointer; transition:background 0.2s; display:flex; align-items:center; justify-content:center; gap:8px; }
        .rp-btn:hover:not(:disabled) { background:#152539; }
        .rp-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .pw-toggle { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#94a3b8; padding:0; display:flex; }
        @keyframes cardIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fu { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .f1{animation:fu 0.4s 0.1s both} .f2{animation:fu 0.4s 0.2s both} .f3{animation:fu 0.4s 0.28s both}
        .f4{animation:fu 0.4s 0.34s both} .f5{animation:fu 0.4s 0.4s both}
      `}</style>

      <div className="rp-card">
        {/* Logo */}
        <div className="f1" style={{ display:'flex', alignItems:'center', gap:12, marginBottom:36 }}>
          <div style={{ width:44, height:44, background:'#1d4ed8', borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <FileText size={22} color="#bfdbfe" />
          </div>
          <div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontSize:17, fontWeight:700, color:'#0d1b2a', letterSpacing:-0.3 }}>DTC System</div>
            <div style={{ fontSize:9, color:'#94a3b8', letterSpacing:'1.8px', textTransform:'uppercase', marginTop:2 }}>Vendor Portal</div>
          </div>
        </div>

        {!done ? (
          <>
            <div className="f2" style={{ marginBottom:28 }}>
              <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:22, fontWeight:700, color:'#0d1b2a', letterSpacing:-0.5, marginBottom:8 }}>Reset Password</h2>
              <p style={{ fontSize:14, color:'#64748b', fontWeight:300 }}>Enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="f3" style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontFamily:"'Sora',sans-serif", fontSize:11, fontWeight:600, color:'#334155', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>New Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showPw ? 'text' : 'password'} className="rp-input" placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="f4" style={{ marginBottom:20 }}>
                <label style={{ display:'block', fontFamily:"'Sora',sans-serif", fontSize:11, fontWeight:600, color:'#334155', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Confirm Password</label>
                <div style={{ position:'relative' }}>
                  <input type={showCf ? 'text' : 'password'} className="rp-input" placeholder="Re-enter password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
                  <button type="button" className="pw-toggle" onClick={() => setShowCf(v => !v)}>
                    {showCf ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:8, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#991B1B', marginBottom:16, lineHeight:1.5 }}>
                  <span>{error}</span>
                </div>
              )}

              <div className="f5">
                <button type="submit" className="rp-btn" disabled={loading || !token}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Resetting...</> : <><KeyRound size={15} /> Reset Password</>}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ textAlign:'center', animation:'fu 0.5s both' }}>
            <div style={{ width:64, height:64, background:'#eff6ff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <CheckCircle size={32} color="#1d4ed8" />
            </div>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:20, fontWeight:700, color:'#0d1b2a', marginBottom:12 }}>Password Reset!</h2>
            <p style={{ fontSize:14, color:'#64748b', lineHeight:1.7, marginBottom:4 }}>Your password has been updated successfully.</p>
            <p style={{ fontSize:13, color:'#94a3b8' }}>Redirecting to login page...</p>
          </div>
        )}

        <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid #f1f5f9', textAlign:'center' }}>
          <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#1d4ed8', textDecoration:'none', fontWeight:500 }}>
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
