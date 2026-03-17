'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

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

      // Simpan vendor_token ke cookie (7 hari)
      document.cookie = `vendor_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

      // Cek role vendor
      const roles: string[] = user.roles ?? [];
      if (!roles.includes('Vendor')) {
        setError('Akun ini bukan akun vendor. Gunakan portal internal DTC.');
        document.cookie = 'vendor_token=; path=/; max-age=0';
        setLoading(false);
        return;
      }

      setAuth(user, token, res.data.refreshToken);
      router.push('/submissions');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Email atau password salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.main}>
      <div style={styles.card}>
        {/* ── PANEL KIRI ── */}
        <div style={styles.left}>
          {/* Geometric background SVG */}
          <svg style={styles.geo} viewBox="0 0 280 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <circle cx="240" cy="70"  r="140" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
            <circle cx="240" cy="70"  r="90"  fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <circle cx="240" cy="70"  r="45"  fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1"/>
            <circle cx="-20" cy="500" r="180" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <circle cx="-20" cy="500" r="110" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>
            <rect x="30"  y="240" width="64" height="64" rx="4" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" transform="rotate(15 62 272)"/>
            <rect x="160" y="370" width="42" height="42" rx="4" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" transform="rotate(-12 181 391)"/>
            <polygon points="90,170 112,208 68,208" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            <polygon points="190,440 210,475 170,475" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
            <line x1="0" y1="300" x2="280" y2="300" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
          </svg>

          {/* Content */}
          <div style={styles.leftTop}>
            <div style={styles.versionBadge}>
              <span style={styles.badgeDot}/>
              DTC System v1.0
            </div>
            <div style={styles.brandIcon}>
              {/* Document icon */}
              <svg width="26" height="26" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
              </svg>
            </div>
            <h1 style={styles.brandTitle}>Vendor{'\n'}Portal</h1>
            <p style={styles.brandSub}>
              Platform pengajuan dokumen terpusat untuk mitra bisnis DTC.
            </p>
          </div>

          <div style={styles.leftBottom}>
            {[
              { label: 'Submission', desc: '— pengajuan & tracking' },
              { label: 'AI Review',  desc: '— analisis otomatis' },
              { label: 'Notifikasi', desc: '— status real-time' },
            ].map((item) => (
              <div key={item.label} style={styles.statRow}>
                <span style={styles.statDot}/>
                <span style={styles.statText}>
                  <strong style={{ color: 'white', fontWeight: 500 }}>{item.label}</strong>
                  {' '}{item.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── PANEL KANAN ── */}
        <div style={styles.right}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Masuk ke akun Anda</h2>
            <p style={styles.formDesc}>Masukkan kredensial vendor untuk melanjutkan</p>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="email@perusahaan.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={styles.input}
                onFocus={(e) => { e.target.style.borderColor = '#185FA5'; e.target.style.backgroundColor = '#fff'; }}
                onBlur={(e)  => { e.target.style.borderColor = '#d1d5db'; e.target.style.backgroundColor = '#f9fafb'; }}
              />
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  style={{ ...styles.input, paddingRight: '42px' }}
                  onFocus={(e) => { e.target.style.borderColor = '#185FA5'; e.target.style.backgroundColor = '#fff'; }}
                  onBlur={(e)  => { e.target.style.borderColor = '#d1d5db'; e.target.style.backgroundColor = '#f9fafb'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  style={styles.pwToggle}
                  aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPw ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div style={styles.errorBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.btnLogin,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Memverifikasi...
                </span>
              ) : 'Masuk'}
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerLine}/>
              <span style={styles.dividerText}>atau</span>
              <span style={styles.dividerLine}/>
            </div>

            {/* Register */}
            <Link href="/register" style={{ textDecoration: 'none' }}>
              <button type="button" style={styles.btnRegister}>
                Daftar sebagai vendor baru
              </button>
            </Link>
          </form>

          <p style={styles.footerNote}>
            DTC System · Vendor Portal · Hanya untuk mitra terdaftar
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600&family=Playfair+Display:wght@600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#EFF2F7',
    padding: '1.5rem',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    display: 'flex',
    width: '100%',
    maxWidth: '860px',
    minHeight: '560px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
  },

  /* ── LEFT PANEL ── */
  left: {
    flex: '0 0 42%',
    background: '#0C447C',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '2.75rem 2.25rem',
    overflow: 'hidden',
  },
  geo: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  leftTop: {
    position: 'relative',
    zIndex: 1,
  },
  versionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '11px',
    color: 'rgba(255,255,255,0.80)',
    marginBottom: '1.5rem',
    fontFamily: "'DM Sans', sans-serif",
  },
  badgeDot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: '#5DCAA5',
    display: 'inline-block',
  },
  brandIcon: {
    width: '52px',
    height: '52px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  brandTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '30px',
    fontWeight: 600,
    color: 'white',
    lineHeight: 1.2,
    whiteSpace: 'pre-line',
    marginBottom: '0.85rem',
  },
  brandSub: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.62)',
    lineHeight: 1.65,
    maxWidth: '220px',
  },
  leftBottom: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#5DCAA5',
    flexShrink: 0,
  },
  statText: {
    fontSize: '12.5px',
    color: 'rgba(255,255,255,0.68)',
  },

  /* ── RIGHT PANEL ── */
  right: {
    flex: 1,
    background: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '2.75rem 2.75rem',
  },
  formHeader: {
    marginBottom: '1.75rem',
  },
  formTitle: {
    fontSize: '20px',
    fontWeight: 600,
    color: '#111827',
    marginBottom: '6px',
    fontFamily: "'DM Sans', sans-serif",
  },
  formDesc: {
    fontSize: '13.5px',
    color: '#6b7280',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
  },
  fieldGroup: {
    marginBottom: '1.1rem',
  },
  label: {
    display: 'block',
    fontSize: '11.5px',
    fontWeight: 600,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    height: '42px',
    padding: '0 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: "'DM Sans', sans-serif",
    color: '#111827',
    background: '#f9fafb',
    outline: 'none',
    transition: 'border-color 0.15s, background-color 0.15s',
  },
  pwToggle: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '13px',
    color: '#991B1B',
    marginBottom: '1rem',
    lineHeight: 1.5,
  },
  btnLogin: {
    width: '100%',
    height: '43px',
    background: '#185FA5',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    letterSpacing: '0.02em',
    transition: 'background 0.15s',
    marginTop: '0.25rem',
    marginBottom: '0',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '1.1rem 0',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: '#e5e7eb',
    display: 'block',
  },
  dividerText: {
    fontSize: '12px',
    color: '#9ca3af',
    whiteSpace: 'nowrap',
  },
  btnRegister: {
    width: '100%',
    height: '42px',
    background: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#374151',
    fontSize: '14px',
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  footerNote: {
    marginTop: '1.5rem',
    fontSize: '11px',
    color: '#9ca3af',
    textAlign: 'center',
  },
};
