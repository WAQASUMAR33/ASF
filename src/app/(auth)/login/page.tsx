'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LockResetIcon from '@mui/icons-material/LockReset';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import AsfLogo from '@/components/ui/AsfLogo';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('officer_khi');
  const [password, setPassword] = useState('ASFPass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [require2FA, setRequire2FA] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (require2FA) {
        const res = await fetch('/api/auth/2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: pendingUserId, code: twoFactorCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid 2FA code');

        router.push('/');
        router.refresh();
        return;
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.require2FA) {
        setRequire2FA(true);
        setPendingUserId(data.userId);
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
        overflow: 'hidden',
      }}
    >
      {/* Fixed Full-Screen Background with Subtle ASF Crest */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at center, #1b4d2e 0%, #0e2919 65%, #08170e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          src="/asf_logo.png"
          alt="ASF Background Crest"
          width={650}
          height={650}
          priority
          unoptimized
          style={{
            objectFit: 'contain',
            opacity: 0.05,
            pointerEvents: 'none',
          }}
        />
      </Box>

      {/* Main Login Widget Container */}
      <Paper
        elevation={16}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 1080,
          borderRadius: 0,
          overflow: 'hidden',
          bgcolor: '#ffffff',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.65)',
        }}
      >
        <Grid container minHeight={600}>
          {/* Left Deep Forest Green Banner with Official Crest Watermark */}
          <Grid
            item
            xs={12}
            md={6.5}
            sx={{
              position: 'relative',
              color: '#ffffff',
              p: { xs: 3, sm: 5 },
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              overflow: 'hidden',
            }}
          >
            {/* Banner Background Official Crest Watermark */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                background: 'linear-gradient(145deg, rgba(20, 56, 32, 0.96), rgba(15, 42, 24, 0.98))',
                overflow: 'hidden',
              }}
            >
              <Image
                src="/asf_logo.png"
                alt="Airports Security Force Official Crest"
                width={420}
                height={420}
                priority
                unoptimized
                style={{
                  objectFit: 'contain',
                  opacity: 0.08,
                  position: 'absolute',
                  right: '-60px',
                  bottom: '-60px',
                  pointerEvents: 'none',
                }}
              />
            </Box>

            {/* Top ASF Official Crest Logo */}
            <Box sx={{ position: 'relative', zIndex: 1, mb: 4 }}>
              <AsfLogo size={56} showText={true} light={true} />
            </Box>

            {/* Middle Feature Bullet Checklist */}
            <Box sx={{ position: 'relative', zIndex: 1, my: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                Please login to manage:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 0.5 }}>
                {[
                  'Station Demand Preparation of Uniform items and Approval Process',
                  'Authorization and Replacement Validation',
                  'HQ Inventory and Deficiency Monitoring',
                  'Central Store Allocation and Stock Dispatch',
                  'Airport Manpower Management',
                  'Audit Trail and User Access Control',
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <ChevronRightIcon sx={{ color: '#f39c12', fontSize: '1.2rem' }} />
                    <Typography
                      variant="body2"
                      sx={{ color: '#ecfdf5', fontWeight: 600, fontSize: '0.875rem', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}
                    >
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Footer Helpline Contacts */}
            <Box sx={{ position: 'relative', zIndex: 1, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box
                  component="a"
                  href="tel:02199242583"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <PhoneIcon sx={{ fontSize: '0.9rem', color: '#f39c12' }} />
                  <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800 }}>021- 99242583</Typography>
                </Box>
                <Box
                  component="a"
                  href="mailto:ddproc@asf.gov.pk"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
                >
                  <EmailIcon sx={{ fontSize: '0.9rem', color: '#f39c12' }} />
                  <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800 }}>ddproc@asf.gov.pk</Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#a7f3d0', fontSize: '0.7rem', opacity: 0.9, mt: 0.5 }}>
                © 2026 Airports Security Force HQ • All rights reserved Government of Pakistan
              </Typography>
            </Box>
          </Grid>

          {/* Right White Form Side */}
          <Grid
            item
            xs={12}
            md={5.5}
            sx={{
              p: { xs: 3, sm: 5 },
              bgcolor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e5631', letterSpacing: 0.5, mb: 0.5 }}>
                LOGIN
              </Typography>
              <Typography variant="caption" sx={{ color: '#56615b', mb: 3, display: 'block' }}>
                Enter your official security handle and password to sign in.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, fontSize: '0.75rem', borderRadius: 0 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {!require2FA ? (
                  <>
                    <TextField
                      fullWidth
                      placeholder="Registration / Username"
                      variant="outlined"
                      size="medium"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: '#1e5631', fontSize: '1.2rem' }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <TextField
                      fullWidth
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      variant="outlined"
                      size="medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: '#1e5631', fontSize: '1.2rem' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </>
                ) : (
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#1e5631', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VpnKeyIcon fontSize="small" /> Enter 6-Digit 2FA Code
                    </Typography>
                    <TextField
                      fullWidth
                      variant="outlined"
                      size="medium"
                      inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: 4, fontWeight: 'bold' } }}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value)}
                      required
                      autoFocus
                    />
                  </Box>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.2,
                    bgcolor: '#1e5631',
                    color: '#ffffff',
                    fontWeight: 800,
                    width: 'fit-content',
                    px: 4,
                    alignSelf: 'flex-start',
                    borderRadius: 0,
                    '&:hover': { bgcolor: '#1b4d2e' },
                  }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : require2FA ? 'Verify 2FA' : 'Login'}
                </Button>
              </Box>

              {/* Sub Links */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, pt: 1 }}>
                <Button
                  size="small"
                  startIcon={<LockResetIcon fontSize="small" />}
                  sx={{ color: '#56615b', fontSize: '0.75rem', textTransform: 'none' }}
                  onClick={() => alert('Contact your Station Store Officer or HQ System Administrator for password reset.')}
                >
                  Forgot Password
                </Button>
                <Button
                  size="small"
                  startIcon={<HelpOutlineIcon fontSize="small" />}
                  sx={{ color: '#56615b', fontSize: '0.75rem', textTransform: 'none' }}
                  onClick={() => alert('ASF IMS Support Helpline: 021- 99242583 | Email: ddproc@asf.gov.pk')}
                >
                  Help & Support
                </Button>
              </Box>
            </Box>

            {/* Bottom Callout Banner Button */}
            <Box sx={{ mt: 3, pt: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<HowToRegIcon />}
                sx={{
                  py: 1.3,
                  bgcolor: '#2d6a4f',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  borderRadius: 0,
                  boxShadow: '0 4px 14px rgba(45, 106, 79, 0.25)',
                  '&:hover': { bgcolor: '#1b4332' },
                }}
                onClick={() => alert('Official Station Officer & Store Clerk Portal Access Active.')}
              >
                Station Store Officer & Clerk Portal
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
