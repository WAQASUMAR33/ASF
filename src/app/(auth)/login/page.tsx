'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import TagIcon from '@mui/icons-material/Tag';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VpnKeyIcon from '@mui/icons-material/VpnKey';

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

  const quickRoles = [
    { username: 'clerk_khi', label: 'Store Clerk (KHI)', station: 'Karachi' },
    { username: 'officer_khi', label: 'Store Officer (KHI)', station: 'Karachi' },
    { username: 'cso_khi', label: 'CSO (KHI)', station: 'Karachi' },
    { username: 'dd_procurement', label: 'DD Procurement (HQ)', station: 'HQ National' },
    { username: 'central_store', label: 'Central Store (HQ)', station: 'HQ Warehouse' },
    { username: 'superadmin', label: 'Super Admin', station: 'Executive HQ' },
  ];

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
        bgcolor: '#faf8f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 4 },
            bgcolor: '#ffffff',
            borderRadius: 3,
            border: '1px solid #e0e2db',
            boxShadow: '0 4px 20px rgba(30, 86, 49, 0.06)',
          }}
        >
          {/* Subheading & Title */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="caption"
              sx={{
                color: '#2d6a4f',
                fontWeight: 800,
                letterSpacing: 2,
                textTransform: 'uppercase',
                display: 'block',
                mb: 0.5,
              }}
            >
              WELCOME BACK
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#191c1a', mb: 1, letterSpacing: -0.5 }}>
              Sign in
            </Typography>
            <Typography variant="body2" sx={{ color: '#56615b', fontSize: '0.875rem' }}>
              Enter your official credentials to access your workspace.
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, fontSize: '0.75rem', borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {!require2FA ? (
              <>
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#56615b', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', mb: 1, display: 'block' }}
                  >
                    FORCE NUMBER / USERNAME
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="e.g. C-16005 or officer_khi"
                    variant="outlined"
                    size="medium"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TagIcon sx={{ color: '#56615b', fontSize: '1.2rem' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: '#56615b', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', mb: 1, display: 'block' }}
                  >
                    PASSWORD
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="••••••••••••"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    size="medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ color: '#56615b', fontSize: '1.2rem' }} />
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
                </Box>
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
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                py: 1.4,
                bgcolor: '#1e5631',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                borderRadius: '12px',
                '&:hover': { bgcolor: '#1b4d2e' },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : require2FA ? 'Verify 2FA Code' : 'Sign in to ASF System'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#56615b', display: 'block', mb: 0.5 }}>
              Contact your administrator for access credentials.
            </Typography>
            <Typography variant="caption" sx={{ color: '#8c9290', fontSize: '0.7rem' }}>
              System Version v0.1.0 • Government of Pakistan
            </Typography>
          </Box>

          {!require2FA && (
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #e0e2db' }}>
              <Typography variant="caption" sx={{ color: '#1e5631', fontWeight: 800, mb: 1.5, display: 'block' }}>
                Quick Test Account Selection (6 RBAC Roles):
              </Typography>
              <Grid container spacing={1}>
                {quickRoles.map((r) => (
                  <Grid item xs={6} key={r.username}>
                    <Button
                      fullWidth
                      size="small"
                      onClick={() => {
                        setUsername(r.username);
                        setPassword('ASFPass123!');
                      }}
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        p: 0.8,
                        fontSize: '0.68rem',
                        bgcolor: username === r.username ? '#1e5631' : '#f5f5f3',
                        color: username === r.username ? '#ffffff' : '#334155',
                        border: username === r.username ? '1px solid #1b4d2e' : '1px solid #e0e2db',
                        borderRadius: '8px',
                        '&:hover': {
                          bgcolor: username === r.username ? '#1b4d2e' : '#e2e8f0',
                        },
                      }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', lineHeight: 1.2 }}>
                          {r.label}
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', opacity: 0.8 }}>
                          {r.station}
                        </Typography>
                      </Box>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
