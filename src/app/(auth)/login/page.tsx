'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
        minHeight: '100vh',
        width: '100%',
        backgroundImage: `linear-gradient(rgba(10, 24, 15, 0.65), rgba(27, 77, 44, 0.75)), url(/airport-bg.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: '100%',
          maxWidth: 1080,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: '#ffffff',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.45)',
        }}
      >
        <Grid container minHeight={600}>
          {/* Left Deep Forest Green Banner with Airport Image Overlay */}
          <Grid
            item
            xs={12}
            md={6.5}
            sx={{
              position: 'relative',
              backgroundImage: `linear-gradient(rgba(20, 56, 32, 0.88), rgba(15, 42, 24, 0.94)), url(/airport-bg.png)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#ffffff',
              p: { xs: 3, sm: 5 },
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
            }}
          >
            {/* Top ASF Official Crest Logo */}
            <Box sx={{ mb: 4 }}>
              <AsfLogo size={56} showText={true} light={true} />
            </Box>

            {/* Middle Feature Bullet Checklist */}
            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                Please login to manage:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pl: 0.5 }}>
                {[
                  'Station Demand Drafting & State Machine Workflow',
                  'Entitlement Ceiling & Replacement Lifecycle Lock Validation',
                  'HQ National Rollup & Real-Time Deficiency Formula Engine',
                  'Multi-Stage Central Store Allocation & Auto-Stock Dispatch',
                  'Station Headcount Manpower Matrix across 30+ Airports',
                  'System Audit Trail & Role-Based Access Control (RBAC)',
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
            <Box sx={{ pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.2)', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: '0.9rem', color: '#f39c12' }} />
                  <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800 }}>051 111 772 772</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: '0.9rem', color: '#f39c12' }} />
                  <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800 }}>helpline@asf.gov.pk</Typography>
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
              {/* Form Top Logo Badge */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <AsfLogo size={36} showText={true} light={false} />
              </Box>

              <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e5631', letterSpacing: 0.5, mb: 0.5 }}>
                LOGIN
              </Typography>
              <Typography variant="caption" sx={{ color: '#56615b', mb: 3, display: 'block' }}>
                Enter your official security handle and password to sign in.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3, fontSize: '0.75rem', borderRadius: 2 }}>
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
                    borderRadius: '8px',
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
                  onClick={() => alert('ASF IMS Support Helpline: 051 111 772 772 | Email: helpline@asf.gov.pk')}
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
                  borderRadius: '10px',
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
