'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Grid,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export default function UsersPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('STORE_CLERK');
  const [stationId, setStationId] = useState('');
  const [password, setPassword] = useState('ASFPass123!');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [uRes, stRes] = await Promise.all([fetch('/api/users'), fetch('/api/stations')]);
      const uData = await uRes.json();
      const sData = await stRes.json();

      setUsersList(uData.users || []);
      setStations(sData.stations || []);
      if (sData.stations?.length > 0) setStationId(sData.stations[0].id);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          fullName,
          role,
          stationId: ['STORE_CLERK', 'STORE_OFFICER', 'CSO'].includes(role) ? stationId : null,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: 400, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Loading RBAC User Registry...
        </Typography>
      </Box>
    );
  }

  const roleColors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
    STORE_CLERK: 'success',
    STORE_OFFICER: 'info',
    CSO: 'secondary',
    DD_PROCUREMENT: 'warning',
    CENTRAL_STORE: 'primary',
    SYSTEM_ADMIN: 'error',
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justify: 'space-between', gap: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettingsIcon color="error" /> User & RBAC Security Management
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            System Administrator Control • Manage Station Scope Assignments, Roles & 2FA Security
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => {
            setShowModal(true);
            setError('');
          }}
        >
          Provision User Account
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1e5631' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>System Role</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Station Scope</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>2FA Protection</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersList.map((u) => (
              <TableRow key={u.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main' }}>
                  @{u.username}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{u.fullName}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{u.email || 'N/A'}</TableCell>
                <TableCell>
                  <Chip label={u.role} color={roleColors[u.role] || 'default'} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  {u.station ? `${u.station.name} (${u.station.code})` : 'National HQ Scope'}
                </TableCell>
                <TableCell>
                  {u.twoFactorEnabled ? (
                    <Chip icon={<VerifiedUserIcon sx={{ fontSize: '0.9rem !important' }} />} label="Active" color="success" size="small" variant="outlined" />
                  ) : (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Disabled</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showModal && (
        <Dialog open maxWidth="sm" fullWidth onClose={() => setShowModal(false)}>
          <DialogTitle sx={{ fontWeight: 800 }}>Provision User Account</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && <Typography variant="caption" color="error">{error}</Typography>}

            <Box component="form" onSubmit={handleCreateUser} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </Grid>
              </Grid>

              <TextField fullWidth size="small" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Role</InputLabel>
                    <Select value={role} label="Role" onChange={(e) => setRole(e.target.value)}>
                      <MenuItem value="STORE_CLERK">STORE_CLERK</MenuItem>
                      <MenuItem value="STORE_OFFICER">STORE_OFFICER</MenuItem>
                      <MenuItem value="CSO">CSO</MenuItem>
                      <MenuItem value="DD_PROCUREMENT">DD_PROCUREMENT</MenuItem>
                      <MenuItem value="CENTRAL_STORE">CENTRAL_STORE</MenuItem>
                      <MenuItem value="SYSTEM_ADMIN">SYSTEM_ADMIN</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {['STORE_CLERK', 'STORE_OFFICER', 'CSO'].includes(role) && (
                  <Grid item xs={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Station</InputLabel>
                      <Select value={stationId} label="Station" onChange={(e) => setStationId(e.target.value)}>
                        {stations.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>

              <TextField fullWidth size="small" label="Initial Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />

              <Box sx={{ display: 'flex', justify: 'flex-end', gap: 2, pt: 2 }}>
                <Button variant="outlined" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={saving}>
                  {saving ? 'Provisioning...' : 'Provision Account'}
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
