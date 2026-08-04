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
  Avatar,
  Grid,
  InputAdornment,
  IconButton,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
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
        backgroundImage: `linear-gradient(rgba(15, 30, 20, 0.65), rgba(30, 86, 49, 0.75)), url(/airport-bg.png)`,
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
          maxWidth: 1050,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: '#ffffff',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}
      >
        <Grid container minHeight={580}>
          {/* Left Deep Forest Green Banner */}
          <Grid
            item
            xs={12}
            md={6.5}
            sx={{
              bgcolor: '#1e5631',
              color: '#ffffff',
              p: { xs: 3, sm: 5 },
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              position: 'relative',
              backgroundImage: 'linear-gradient(135deg, #1e5631 0%, #11361e 100%)',
            }}
          >
            {/* Top Branding Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Avatar
                sx={{
                  bgcolor: 'transparent',
                  color: '#ffffff',
                  border: '2px solid rgba(255, 255, 255, 0.8)',
                  width: 56,
                  height: 56,
                }}
              >
                <SecurityIcon sx={{ fontSize: 36 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 0.5, lineHeight: 1.1 }}>
                  AIRPORTS SECURITY FORCE
                </Typography>
                <Typography variant="caption" sx={{ color: '#a7f3d0', fontWeight: 600, letterSpacing: 0.5 }}>
                  Logistics & Inventory Division • Government of Pakistan
                </Typography>
              </Box>
            </Box>

            {/* Middle Feature Bullet Checklist */}
            <Box sx={{ my: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#ffffff' }}>
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
                    <ChevronRightIcon sx={{ color: '#a7f3d0', fontSize: '1.2rem' }} />
                    <Typography variant="body2" sx={{ color: '#ecfdf5', fontWeight: 500, fontSize: '0.875rem' }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Footer Helpline Contacts */}
            <Box sx={{ pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.15)', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: '0.9rem', color: '#a7f3d0' }} />
                  <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700 }}>051 111 772 772</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon sx={{ fontSize: '0.9rem', color: '#a7f3d0' }} />
                  <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 700 }}>helpline@asf.gov.pk</Typography>
                </Box>
              </Box>
              <Typography variant="caption" sx={{ color: '#a7f3d0', fontSize: '0.7rem', opacity: 0.8, mt: 0.5 }}>
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
              {/* Form Top Brand Icon */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon sx={{ color: '#1e5631', fontSize: 28 }} />
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e5631', letterSpacing: 0.5 }}>
                    ASF IMS
                  </Typography>
                </Box>
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
