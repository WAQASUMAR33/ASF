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
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';

export default function UsersPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [currentUserMe, setCurrentUserMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [deletingUser, setDeletingUser] = useState<any | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('STORE_CLERK');
  const [stationId, setStationId] = useState('');
  const [password, setPassword] = useState('ASFPass123!');
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsersData = async () => {
    setLoading(true);
    try {
      const [uRes, stRes, meRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/stations'),
        fetch('/api/auth/me'),
      ]);

      const uData = await uRes.json();
      const sData = await stRes.json();
      const meData = await meRes.json();

      setUsersList(uData.users || []);
      setStations(sData.stations || []);
      if (meData.user) setCurrentUserMe(meData.user);
      if (sData.stations?.length > 0) setStationId(sData.stations[0].id);
    } catch (err) {
      console.error('Failed to load RBAC users registry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  // Open Create Modal
  const handleOpenCreate = () => {
    setUsername('');
    setEmail('');
    setFullName('');
    setRole('STORE_CLERK');
    if (stations.length > 0) setStationId(stations[0].id);
    setPassword('ASFPass123!');
    setIsActive(true);
    setError('');
    setShowCreateModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setUsername(user.username);
    setEmail(user.email || '');
    setFullName(user.fullName);
    setRole(user.role);
    setStationId(user.stationId || (stations.length > 0 ? stations[0].id : ''));
    setPassword(''); // blank means do not change password
    setIsActive(user.isActive !== false);
    setError('');
  };

  // Create User Handler
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

      setShowCreateModal(false);
      fetchUsersData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Edit User Handler
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    setSaving(true);

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          role,
          stationId: ['STORE_CLERK', 'STORE_OFFICER', 'CSO'].includes(role) ? stationId : null,
          isActive,
          password: password || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user');

      setEditingUser(null);
      fetchUsersData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active / Deactive Handler
  const handleToggleActive = async (user: any) => {
    if (currentUserMe?.id === user.id) {
      alert('You cannot deactivate your own logged-in admin account.');
      return;
    }

    setStatusUpdatingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user status');

      fetchUsersData();
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Remove Access Handler
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove user account');

      setDeletingUser(null);
      fetchUsersData();
    } catch (err: any) {
      alert(err.message || 'Error removing user');
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
      {/* Header Bar */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justify: 'space-between', gap: 2, borderBottom: '1px solid #e0e2db', pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#191c1a', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminPanelSettingsIcon color="error" /> User & RBAC Security Management
          </Typography>
          <Typography variant="caption" sx={{ color: '#56615b' }}>
            System Administrator Control • Manage Station Scope Assignments, Edit Access, Active Status & Account Removal
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenCreate}
          sx={{ bgcolor: '#1e5631', '&:hover': { bgcolor: '#1b4d2e' } }}
        >
          Provision User Account
        </Button>
      </Box>

      {/* Users Table */}
      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2, border: '1px solid #e0e2db' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1e5631' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Username</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>System Role</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Station Scope</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>2FA Protection</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersList.map((u) => {
              const isSelf = currentUserMe?.id === u.id;
              const userActive = u.isActive !== false;

              return (
                <TableRow key={u.id} hover sx={{ opacity: userActive ? 1 : 0.6, bgcolor: userActive ? 'inherit' : '#f8f9fa' }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#1e5631' }}>
                    @{u.username}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {u.fullName} {isSelf && <Chip label="You" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: '0.6rem', ml: 0.5 }} />}
                  </TableCell>
                  <TableCell sx={{ color: '#56615b' }}>{u.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={u.role} color={roleColors[u.role] || 'default'} size="small" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {u.station ? `${u.station.name} (${u.station.code})` : 'National HQ Scope'}
                  </TableCell>
                  <TableCell>
                    {userActive ? (
                      <Chip label="Active" color="success" size="small" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                    ) : (
                      <Chip label="Deactivated" color="error" variant="outlined" size="small" sx={{ fontWeight: 700, fontSize: '0.68rem' }} />
                    )}
                  </TableCell>
                  <TableCell>
                    {u.twoFactorEnabled ? (
                      <Chip icon={<VerifiedUserIcon sx={{ fontSize: '0.9rem !important' }} />} label="Active" color="success" size="small" variant="outlined" />
                    ) : (
                      <Typography variant="caption" sx={{ color: '#56615b' }}>Disabled</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="Edit User Access & Scope">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(u)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title={userActive ? (isSelf ? 'Cannot deactivate self' : 'Deactivate Access') : 'Activate Access'}>
                        <span>
                          <IconButton
                            size="small"
                            color={userActive ? 'warning' : 'success'}
                            disabled={statusUpdatingId === u.id || isSelf}
                            onClick={() => handleToggleActive(u)}
                          >
                            {userActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>

                      <Tooltip title={isSelf ? 'Cannot delete self' : 'Remove User Access'}>
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={isSelf}
                            onClick={() => setDeletingUser(u)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Provision User Account Modal */}
      {showCreateModal && (
        <Dialog open maxWidth="sm" fullWidth onClose={() => setShowCreateModal(false)}>
          <DialogTitle sx={{ fontWeight: 800 }}>Provision User Account</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" id="create-user-form" onSubmit={handleCreateUser} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </Grid>
              </Grid>

              <TextField fullWidth size="small" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>System Role</InputLabel>
                    <Select value={role} label="System Role" onChange={(e) => setRole(e.target.value)}>
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
                      <InputLabel>Station Scope</InputLabel>
                      <Select value={stationId} label="Station Scope" onChange={(e) => setStationId(e.target.value)}>
                        {stations.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>

              <TextField fullWidth size="small" label="Initial Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="outlined" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" form="create-user-form" variant="contained" color="primary" disabled={saving} sx={{ bgcolor: '#1e5631', '&:hover': { bgcolor: '#1b4d2e' } }}>
              {saving ? 'Provisioning...' : 'Provision Account'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit User Account Modal */}
      {editingUser && (
        <Dialog open maxWidth="sm" fullWidth onClose={() => setEditingUser(null)}>
          <DialogTitle sx={{ fontWeight: 800 }}>Edit User Account (@{editingUser.username})</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" id="edit-user-form" onSubmit={handleUpdateUser} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Username" disabled value={username} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </Grid>
              </Grid>

              <TextField fullWidth size="small" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>System Role</InputLabel>
                    <Select value={role} label="System Role" onChange={(e) => setRole(e.target.value)}>
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
                      <InputLabel>Station Scope</InputLabel>
                      <Select value={stationId} label="Station Scope" onChange={(e) => setStationId(e.target.value)}>
                        {stations.map((s) => (
                          <MenuItem key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>

              <TextField
                fullWidth
                size="small"
                label="Reset Password (Optional)"
                type="password"
                placeholder="Leave blank to keep existing password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Only fill if you want to reset password for this user."
              />

              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={currentUserMe?.id === editingUser.id} />}
                label={isActive ? 'Account Status: Active' : 'Account Status: Deactivated'}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="outlined" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" form="edit-user-form" variant="contained" color="primary" disabled={saving} sx={{ bgcolor: '#1e5631', '&:hover': { bgcolor: '#1b4d2e' } }}>
              {saving ? 'Saving...' : 'Save User Access Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete User Confirmation Dialog */}
      {deletingUser && (
        <Dialog open maxWidth="xs" fullWidth onClose={() => setDeletingUser(null)}>
          <DialogTitle sx={{ fontWeight: 800, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" /> Confirm Access Removal
          </DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" sx={{ color: '#191c1a', mb: 1 }}>
              Are you sure you want to remove user account access for <strong>{deletingUser.fullName}</strong> (<code>@{deletingUser.username}</code>)?
            </Typography>
            <Typography variant="caption" sx={{ color: '#56615b', display: 'block' }}>
              This action will delete the account from the RBAC User Registry. The user will immediately lose access to the portal.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="outlined" onClick={() => setDeletingUser(null)}>
              Cancel
            </Button>
            <Button variant="contained" color="error" disabled={saving} onClick={handleConfirmDelete}>
              {saving ? 'Removing...' : 'Remove User Account'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
