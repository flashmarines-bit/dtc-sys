'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { AuthResponse } from '@/types'
import { Loader2, FileText, ExternalLink, Shield } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [itSupport, setItSupport] = useState({ url: 'mailto:itsupport@dtc.local', label: 'IT Support' })

  useEffect(() => {
    api.get('/api/system-settings/public/it-support')
      .then(({ data }) => {
        if (data.url || data.label) {
          setItSupport({
            url: data.url || 'mailto:itsupport@dtc.local',
            label: data.label || 'IT Support'
          })
        }
      })
      .catch(() => {})
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password })
      setAuth(data.user, data.token, data.refreshToken)
      toast.success(`Welcome, ${data.user.fullName}!`)
      router.push('/home')
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Login failed. Please check your credentials.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#eef0eb', backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231a2e1e' fill-opacity='0.04'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E\")", display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:"'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        .dtc-card { display:flex; width:100%; max-width:880px; min-height:600px; border-radius:22px; overflow:hidden; box-shadow:0 28px 72px rgba(26,46,30,0.18),0 4px 20px rgba(26,46,30,0.08); animation:cardIn 0.6s cubic-bezier(0.22,1,0.36,1) both; }
        .dtc-left { width:44%; align-self:stretch; min-height:100%; background:#1a2e1e; position:relative; display:flex; flex-direction:column; justify-content:space-between; padding:44px 40px; overflow:hidden; }
        .dtc-left::before { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px); background-size:44px 44px; }
        .dtc-left::after { content:''; position:absolute; width:460px; height:460px; border-radius:50%; background:radial-gradient(circle,rgba(58,125,68,0.22) 0%,transparent 70%); bottom:-140px; right:-110px; }
        .dtc-right { flex:1; background:white; display:flex; flex-direction:column; justify-content:center; padding:44px 52px; }
        .deco-ring { position:absolute; border-radius:50%; border:1px solid rgba(255,255,255,0.06); pointer-events:none; }
        .z2 { position:relative; z-index:2; }
        .dtc-input { width:100%; height:50px; padding:0 16px; border:1.5px solid #d4ddd5; border-radius:10px; font-size:14px; font-family:'DM Sans',sans-serif; color:#1a2e1e; background:#f5f7f5; outline:none; transition:border-color 0.2s,box-shadow 0.2s,background 0.2s; }
        .dtc-input:focus { border-color:#3a7d44; background:white; box-shadow:0 0 0 3px rgba(58,125,68,0.1); }
        .dtc-btn { width:100%; height:52px; background:#1a2e1e; color:#e8f0e9; border:none; border-radius:10px; font-family:'Sora',sans-serif; font-size:13px; font-weight:600; letter-spacing:1px; cursor:pointer; position:relative; overflow:hidden; transition:background 0.2s,transform 0.15s; }
        .dtc-btn:hover:not(:disabled) { background:#243d28; }
        .dtc-btn:active:not(:disabled) { transform:scale(0.99); }
        .dtc-btn:disabled { opacity:0.7; cursor:not-allowed; }
        .btn-shimmer { position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent); transform:translateX(-100%); animation:shimmer 2.5s infinite; }
        .stats-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:0; }
        .stat-item { padding:0 16px 0 0; }
        .stat-item + .stat-item { padding-left:16px; border-left:1px solid rgba(255,255,255,0.08); }
        .stat-num { font-family:'Sora',sans-serif; font-size:22px; font-weight:700; color:#e8f0e9; letter-spacing:-0.8px; }
        .stat-lbl { font-size:9px; color:rgba(232,240,233,0.3); letter-spacing:1.2px; text-transform:uppercase; margin-top:3px; }
        @keyframes cardIn { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 50%,100%{transform:translateX(100%)} }
        @keyframes fu { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .f1{animation:fu 0.5s 0.15s both} .f2{animation:fu 0.5s 0.25s both} .f3{animation:fu 0.5s 0.35s both}
        .f4{animation:fu 0.5s 0.42s both} .f5{animation:fu 0.5s 0.5s both} .f6{animation:fu 0.5s 0.57s both}
        .f7{animation:fu 0.5s 0.63s both} .f8{animation:fu 0.5s 0.7s both}
        .dev-link { font-family:'Sora',sans-serif; font-size:12px; font-weight:600; color:rgba(232,240,233,0.6); text-decoration:none; display:inline-flex; align-items:center; gap:5px; transition:color 0.2s; }
        .dev-link:hover { color:#7ec897; }
        .forgot-link { font-size:13px; color:#3a7d44; text-decoration:none; }
        .reg-link { color:#3a7d44; text-decoration:none; font-weight:500; }
        .copy-link { color:#3a7d44; text-decoration:none; font-weight:500; }
      `}</style>

      <div className="dtc-card">

        {/* LEFT PANEL */}
        <div className="dtc-left">
          <div className="deco-ring" style={{ width:300, height:300, top:-80, left:-80 }} />
          <div className="deco-ring" style={{ width:180, height:180, top:50, left:50, borderColor:'rgba(255,255,255,0.04)' }} />
          <div className="deco-ring" style={{ width:220, height:220, bottom:60, right:-60 }} />

          {/* Top */}
          <div className="z2">
            {/* Brand */}
            <div className="f1" style={{ display:'flex', alignItems:'center', gap:16, marginBottom:52 }}>
              <div style={{ width:52, height:52, background:'#3a7d44', borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <FileText size={26} color="#d4edda" />
              </div>
              <div>
                <div style={{ fontFamily:"'Sora',sans-serif", fontSize:21, fontWeight:700, color:'#e8f0e9', letterSpacing:-0.5 }}>DTC System</div>
                <div style={{ fontSize:9, color:'rgba(232,240,233,0.35)', letterSpacing:'1.5px', textTransform:'uppercase', whiteSpace:'nowrap', marginTop:3 }}>Document Track Action Control</div>
              </div>
            </div>

            {/* Badge */}
            <div className="f2" style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(58,125,68,0.2)', border:'1px solid rgba(58,125,68,0.35)', padding:'6px 16px', borderRadius:20, marginBottom:32 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#7ec897' }} />
              <span style={{ fontFamily:"'Sora',sans-serif", fontSize:11, fontWeight:500, color:'#7ec897', letterSpacing:'1px', textTransform:'uppercase' }}>Internal Portal</span>
            </div>

            {/* Features */}
            <div className="f3" style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {[
                'Real-time form management and vendor submission tracking',
                'Structured approval workflow with complete audit trail',
                'Role-based access control with multi-layer security',
              ].map((txt, i) => (
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:13 }}>
                  <div style={{ width:7, height:7, borderRadius:'50%', background:'#3a7d44', flexShrink:0, marginTop:7 }} />
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:'rgba(232,240,233,0.5)', fontWeight:300, lineHeight:1.7 }}>{txt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="z2">
            {/* Stats */}
            <div className="f4 stats-grid" style={{ marginBottom:24 }}>
              {[['3+','Active Modules'],['100%','Audit Trail'],['24/7','Uptime']].map(([n,l],i) => (
                <div key={i} className="stat-item">
                  <div className="stat-num">{n}</div>
                  <div className="stat-lbl">{l}</div>
                </div>
              ))}
            </div>

            {/* Dev info */}
            <div className="f5" style={{ borderTop:'1px solid rgba(255,255,255,0.07)', paddingTop:20, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
              <div>
                <div style={{ fontSize:9, color:'rgba(232,240,233,0.22)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:5 }}>Developed & Published by</div>
                <a href="https://www.maccom.id" target="_blank" rel="noreferrer" className="dev-link">
                  MACCOM.ID <ExternalLink size={10} style={{ opacity:0.4 }} />
                </a>
              </div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:10, fontWeight:500, color:'rgba(232,240,233,0.28)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', padding:'4px 10px', borderRadius:20 }}>v1.00</div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="dtc-right">
          {/* Header */}
          <div className="f1" style={{ marginBottom:36 }}>
            <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:28, fontWeight:700, color:'#1a2e1e', letterSpacing:-0.7, marginBottom:8 }}>Sign In</h2>
            <p style={{ fontSize:14, color:'#6b7c6d', fontWeight:300 }}>Enter your credentials to access the system</p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email */}
            <div className="f2" style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontFamily:"'Sora',sans-serif", fontSize:11, fontWeight:600, color:'#3d5140', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Email</label>
              <input type="email" className="dtc-input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>

            {/* Password */}
            <div className="f3" style={{ marginBottom:4 }}>
              <label style={{ display:'block', fontFamily:"'Sora',sans-serif", fontSize:11, fontWeight:600, color:'#3d5140', letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Password</label>
              <input type="password" className="dtc-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>

            {/* IT Support */}
            <div className="f4" style={{ display:'flex', justifyContent:'flex-end', marginBottom:28 }}>
              <a href={itSupport.url} className="forgot-link">Need help? Contact {itSupport.label}</a>
            </div>

            {/* Button */}
            <div className="f5">
              <button type="submit" className="dtc-btn" disabled={loading}>
                <div className="btn-shimmer" />
                {loading
                  ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}><Loader2 size={16} className="animate-spin" /> Processing...</span>
                  : 'SIGN IN'
                }
              </button>
            </div>
          </form>





          {/* Security */}
          <div className="f7" style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#f0f4f0', border:'1px solid #d4ddd5', borderRadius:10, marginTop:24 }}>
            <Shield size={15} color="#3a7d44" style={{ flexShrink:0 }} />
            <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#6b7c6d', lineHeight:1.5 }}>Secured with SSL encryption. Your data is fully protected.</span>
          </div>

          {/* Copyright */}
          <div className="f8" style={{ textAlign:'center', fontSize:11, color:'#9aaa9c', marginTop:18, lineHeight:1.7 }}>
            © 2026 DTC System. All rights reserved. &nbsp;·&nbsp;
            Developed & Published by <a href="https://www.maccom.id" target="_blank" rel="noreferrer" className="copy-link">MACCOM.ID</a>
          </div>
        </div>

      </div>
    </div>
  )
}
