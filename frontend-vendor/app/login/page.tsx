'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Loader2, FileText, ExternalLink, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      document.cookie = `vendor_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      const roles: string[] = user.roles ?? [];
      if (!roles.includes('Vendor')) {
        setError('This account is not a vendor account. Please use the internal DTC portal.');
        document.cookie = 'vendor_token=; path=/; max-age=0';
        setLoading(false);
        return;
      }
      setAuth(user, token, res.data.refreshToken);
      router.push('/submissions');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#eaecf2', backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%230d1b2a' fill-opacity='0.04'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E\")", display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        .vnav-card { display:flex; width:100%; max-width:880px; min-height:600px; border-radius:22px; overflow:hidden; box-shadow:0 28px 72px rgba(13,27,42,0.18),0 4px 20px rgba(13,27,42,0.08); animation:cardIn 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .vnav-left { width:44%; background:#0d1b2a; position:relative; display:flex; flex-direction:column; justify-content:space-between; padding:44px 40px; overflow:hidden; align-self:stretch; }
        .vnav-left::before { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px); background-size:44px 44px; }
        .vnav-left::after { content:''; position:absolute; width:420px; height:420px; border-radius:50%; background:radial-gradient(circle,rgba(29,78,216,0.2) 0%,transparent 70%); bottom:-130px; right:-100px; }
        .vnav-right { flex:1; background:white; display:flex; flex-direction:column; justify-content:center; padding:44px 52px; }
        .deco-ring { position:absolute; border-radius:50%; border:1px solid rgba(255,255,255,0.06); pointer-events:none; }
        .z2 { position:relative; z-index:2; }
        .vnav-input { width:100%; height:50px; padding:0 16px; border:1.5px solid #cbd5e1; border-radius:10px; font-size:14px; font-family:'DM Sans',sans-serif; color:#0d1b2a; background:#f5f7fa; outline:none; transition:border-color 0.2s,box-shadow 0.2s,background 0.2s; }
        .vnav-input:focus { border-color:#1d4ed8; background:white; box-shadow:0 0 0 3px rgba(29,78,216,0.1); }
        .vnav-btn { width:100%; height:52px; background:#0d1b2a; color:#e8edf5; border:none; border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; font-weight:600; letter-spacing:1px; cursor:pointer; position:relative; overflow:hidden; transition:background 0.2s,transform 0.15s; }
        .vnav-btn:hover:not(:disabled) { background:#152539; }
        .vnav-btn:active:not(:disabled) { transform:scale(0.99); }
        .vnav-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .btn-shimmer { position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent); transform:translateX(-100%); animation:shimmer 2.5s infinite; }
        .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0; }
        .stat-item { padding-right:16px; }
        .stat-item+.stat-item { padding-left:16px; border-left:1px solid rgba(255,255,255,0.08); }
        .stat-num { font-family:'Sora',sans-serif; font-size:22px; font-weight:700; color:#e8edf5; letter-spacing:-0.8px; }
        .stat-lbl { font-size:9px; color:rgba(232,237,245,0.3); letter-spacing:1.2px; text-transform:uppercase; margin-top:3px; }
        .dev-link { font-family:'Sora',sans-serif; font-size:12px; font-weight:600; color:rgba(232,237,245,0.6); text-decoration:none; display:inline-flex; align-items:center; gap:5px; transition:color 0.2s; }
        .dev-link:hover { color:#93c5fd; }
        .pw-toggle { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9ca3af; padding:0; display:flex; align-items:center; }
        @keyframes cardIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 50%,100%{transform:translateX(100%)} }
        @keyframes fu { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .f1{animation:fu 0.5s 0.15s both} .f2{animation:fu 0.5s 0.25s both} .f3{animation:fu 0.5s 0.32s both}
        .f4{animation:fu 0.5s 0.39s both} .f5{animation:fu 0.5s 0.46s both} .f6{animation:fu 0.5s 0.53s both}
        .f7{animation:fu 0.5s 0.6s both} .f8{animation:fu 0.5s 0.67s both}
      `}</style>

      <div className="vnav-card">

        {/* LEFT PANEL */}
        <div className="vnav-left">
          <div className="deco-ring" style={{ width:280, height:280, top:-70, left:-70 }} />
          <div className="deco-ring" style={{ width:160, height:160, top:45, left:45, borderColor:'rgba(255,255,255,0.04)' }} />
          <div className="deco-ring" style={{ width:200, height:200, bottom:55, right:-55 }} />

          {/* Top */}
          <div className="z2">
            {/* Brand */}
            <div className="f1" style={{ display:'flex', alignItems:'center', gap:14, marginBottom:44 }}>
              <div style={{ width:48, height:48, background:'#1d4ed8', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FileText size={24} color="#bfdbfe" />
              </div>
              <div>
                <div style={{ fontFamily:"'Sora',sans-serif", fontSize:19, fontWeight:700, color:'#e8edf5', letterSpacing:-0.4 }}>DTC System</div>
                <div style={{ fontSize:9, color:'rgba(232,237,245,0.35)', letterSpacing:'2px', textTransform:'uppercase', marginTop:3, whiteSpace:'nowrap' }}>Document Track Action Control</div>
              </div>
            </div>

            {/* Vendor Badge */}
            <div className="f2" style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(29,78,216,0.2)', border:'1px solid rgba(29,78,216,0.35)', padding:'5px 14px', borderRadius:20, marginBottom:28 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#60a5fa' }} />
              <span style={{ fontFamily:"'Sora',sans-serif", fontSize:10, fontWeight:500, color:'#93c5fd', letterSpacing:'1px', textTransform:'uppercase' }}>Vendor Portal</span>
            </div>

            {/* Features */}
            <div className="f3" style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {[
                'Real-time form management and vendor submission tracking',
                'Structured approval workflow with complete audit trail',
                'Role-based access control with multi-layer security',
              ].map((txt, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#1d4ed8', flexShrink:0, marginTop:7 }} />
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(232,237,245,0.48)', fontWeight:300, lineHeight:1.65 }}>{txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="z2">
            <div className="f4 stats-grid" style={{ marginBottom:22 }}>
              {[['3+','Active Modules'],['100%','Audit Trail'],['24/7','Uptime']].map(([n,l],i) => (
                <div key={i} className="stat-item">
                  <div className="stat-num">{n}</div>
                  <div className="stat-lbl">{l}</div>
                </div>
              ))}
            </div>
            <div className="f5" style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:18, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <div>
                <div style={{ fontSize:9, color:'rgba(232,237,245,0.22)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:5 }}>Developed & Published by</div>
                <a href="https://www.maccom.id" target="_blank" rel="noreferrer" className="dev-link">
                  MACCOM.ID <ExternalLink size={10} style={{ opacity:0.4 }} />
                </a>
              </div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:10, fontWeight:500, color:'rgba(232,237,245,0.28)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', padding:'4px 10px', borderRadius:20 }}>v1.00</div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="vnav-right">
          <div className="f1" style={{ marginBottom:24 }}>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:26, fontWeight:700, color:'#0d1b2a', letterSpacing:-0.7, marginBottom:8 }}>Sign In</h2>
            <p style={{ fontSize:14, color:'#64748b', fontWeight:300 }}>Enter your credentials to access the vendor portal</p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="f2" style={{ marginBottom:14 }}>
              <label style={{ display:'block', fontFamily:"'Sora',sans-serif", fontSize:11, fontWeight:600, color:'#334155', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Email</label>
              <input type="email" className="vnav-input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            {/* Password */}
            <div className="f3" style={{ marginBottom:4 }}>
              <label style={{ display:'block', fontFamily:"'Sora',sans-serif", fontSize:11, fontWeight:600, color:'#334155', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPw ? 'text' : 'password'} className="vnav-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" style={{ paddingRight:42 }} />
                <button type="button" className="pw-toggle" onClick={() => setShowPw(v => !v)} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {/* Forgot */}
            <div className="f4" style={{ display:'flex', justifyContent:'flex-end', marginBottom:18 }}>
              <a href="/forgot-password" style={{ fontSize:12, color:'#1d4ed8', textDecoration:'none' }}>Forgot password?</a>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display:'flex', alignItems:'flex-start', gap:8, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#991B1B', marginBottom:16, lineHeight:1.5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </div>
            )}

            {/* Button */}
            <div className="f5">
              <button type="submit" className="vnav-btn" disabled={loading}>
                <div className="btn-shimmer" />
                {loading
                  ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Loader2 size={16} className="animate-spin" /> Verifying...</span>
                  : 'SIGN IN'
                }
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="f6" style={{ display:'flex', alignItems:'center', gap:12, margin:'14px 0' }}>
            <div style={{ flex:1, height:1, background:'#cbd5e1' }} />
            <span style={{ fontSize:12, color:'#94a3b8' }}>or</span>
            <div style={{ flex:1, height:1, background:'#cbd5e1' }} />
          </div>

          {/* Register */}
          <div className="f6" style={{ marginBottom:16 }}>
            <Link href="/register" style={{ textDecoration:'none' }}>
              <button type="button" style={{ width:'100%', height:48, background:'transparent', border:'1.5px solid #cbd5e1', borderRadius:10, fontFamily:"'Sora',sans-serif", fontSize:13, fontWeight:500, color:'#334155', cursor:'pointer', transition:'border-color 0.2s' }}>
                Register as a new vendor
              </button>
            </Link>
          </div>

          {/* Security */}
          <div className="f7" style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#f0f4fa', border:'1px solid #cbd5e1', borderRadius:10, marginBottom:14 }}>
            <Shield size={15} color="#1d4ed8" style={{ flexShrink:0 }} />
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#64748b', lineHeight:1.5 }}>Secured with SSL encryption. Your data is fully protected.</span>
          </div>

          {/* Copyright */}
          <div className="f8" style={{ textAlign:'center', fontSize:11, color:'#94a3b8', lineHeight:1.7 }}>
            © 2026 DTC System. All rights reserved. &nbsp;·&nbsp;
            Developed & Published by <a href="https://www.maccom.id" target="_blank" rel="noreferrer" style={{ color:'#1d4ed8', textDecoration:'none', fontWeight:500 }}>MACCOM.ID</a>
          </div>
        </div>

      </div>
    </div>
  );
}
