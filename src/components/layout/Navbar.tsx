'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  Tooltip,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import LogoutIcon from '@mui/icons-material/Logout';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

interface NavbarProps {
  user: {
    fullName: string;
    username: string;
    role: string;
    station?: { name: string; code: string } | null;
    twoFactorEnabled?: boolean;
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Sign out error:', error);
      window.location.href = '/login';
    }
  };

  const roleColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
    STORE_CLERK: 'success',
    STORE_OFFICER: 'info',
    CSO: 'primary',
    DD_PROCUREMENT: 'warning',
    CENTRAL_STORE: 'secondary',
    SYSTEM_ADMIN: 'error',
  };

  return (
    <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#ffffff', color: '#191c1a', borderBottom: '1px solid #e0e2db' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
        {/* Left Brand Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#1e5631', color: '#ffffff', fontWeight: 'bold' }}>
            <SecurityIcon />
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#1e5631', letterSpacing: 0.5 }}>
                ASF IMS
              </Typography>
              <Chip label="Forest Green" size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
            </Box>
            <Typography variant="caption" sx={{ color: '#56615b', display: { xs: 'none', sm: 'block' } }}>
              Airports Security Force • Government of Pakistan
            </Typography>
          </Box>
        </Box>

        {/* Right User Bar */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {user?.station && (
            <Chip
              icon={<LocationOnIcon sx={{ fontSize: '1rem !important' }} />}
              label={`${user.station.name} (${user.station.code})`}
              variant="outlined"
              color="primary"
              size="small"
              sx={{ display: { xs: 'none', md: 'flex' }, fontWeight: 700 }}
            />
          )}

          {user?.role && (
            <Chip
              label={user.role}
              color={roleColors[user.role] || 'default'}
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          )}

          {user?.twoFactorEnabled && (
            <Tooltip title="2FA Verification Active">
              <Chip
                icon={<VerifiedUserIcon sx={{ fontSize: '0.9rem !important' }} />}
                label="2FA Active"
                color="success"
                size="small"
                variant="outlined"
                sx={{ display: { xs: 'none', sm: 'flex' } }}
              />
            </Tooltip>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 2, borderLeft: '1px solid #e0e2db' }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#191c1a' }}>
                {user?.fullName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#56615b', fontFamily: 'monospace' }}>
                @{user?.username}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleLogout}
              disabled={loggingOut}
              startIcon={<LogoutIcon />}
            >
              Sign Out
            </Button>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
