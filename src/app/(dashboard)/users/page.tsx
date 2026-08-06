'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Avatar,
  InputAdornment,
  Divider,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import ShieldIcon from '@mui/icons-material/Shield';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function UsersPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [currentUserMe, setCurrentUserMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      // Search match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.username?.toLowerCase().includes(q) ||
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.station?.name?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q);

      // Role match
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

      // Status match
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && u.isActive !== false) ||
        (statusFilter === 'INACTIVE' && u.isActive === false);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersList, searchQuery, roleFilter, statusFilter]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = usersList.length;
    const hqCount = usersList.filter((u) => ['SYSTEM_ADMIN', 'DD_PROCUREMENT', 'CENTRAL_STORE'].includes(u.role)).length;
    const stationCount = usersList.filter((u) => ['STORE_CLERK', 'STORE_OFFICER', 'CSO'].includes(u.role)).length;
    const activeCount = usersList.filter((u) => u.isActive !== false).length;
    return { total, hqCount, stationCount, activeCount };
  }, [usersList]);

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
    setPassword('');
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

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const roleColors: Record<string, { color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'; bg: string; text: string }> = {
    STORE_CLERK: { color: 'success', bg: '#e8f5e9', text: '#2e7d32' },
    STORE_OFFICER: { color: 'info', bg: '#e3f2fd', text: '#1565c0' },
    CSO: { color: 'secondary', bg: '#f3e5f5', text: '#7b1fa2' },
    DD_PROCUREMENT: { color: 'warning', bg: '#fff3e0', text: '#e65100' },
    CENTRAL_STORE: { color: 'primary', bg: '#e8f5e9', text: '#1e5631' },
    SYSTEM_ADMIN: { color: 'error', bg: '#ffebee', text: '#c62828' },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 4 }}>
      {/* Top Title Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          bgcolor: '#ffffff',
          borderRadius: 0,
          border: '1px solid #e0e2db',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: '#1e5631',
              color: '#ffffff',
              width: 48,
              height: 48,
              boxShadow: '0 4px 12px rgba(30, 86, 49, 0.25)',
            }}
          >
            <AdminPanelSettingsIcon fontSize="medium" />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#191c1a', letterSpacing: -0.3 }}>
              User & RBAC Security Management
            </Typography>
            <Typography variant="body2" sx={{ color: '#56615b', fontWeight: 500 }}>
              System Administrator Control • Manage Station Scope Assignments, Roles & 2FA Security
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          size="large"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#1e5631',
            color: '#ffffff',
            fontWeight: 800,
            px: 3,
            py: 1.2,
            borderRadius: 0,
            textTransform: 'none',
            boxShadow: '0 4px 14px rgba(30, 86, 49, 0.3)',
            '&:hover': {
              bgcolor: '#153e23',
              boxShadow: '0 6px 18px rgba(30, 86, 49, 0.4)',
            },
          }}
        >
          Provision User Account
        </Button>
      </Paper>

      {/* KPI Metrics Row */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#ffffff', border: '1px solid #e0e2db', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(30, 86, 49, 0.1)', color: '#1e5631', width: 44, height: 44 }}>
              <PeopleIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total Accounts
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#191c1a' }}>
                {stats.total}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#ffffff', border: '1px solid #e0e2db', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(198, 40, 40, 0.1)', color: '#c62828', width: 44, height: 44 }}>
              <ShieldIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                HQ Administrators
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#191c1a' }}>
                {stats.hqCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#ffffff', border: '1px solid #e0e2db', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(21, 101, 192, 0.1)', color: '#1565c0', width: 44, height: 44 }}>
              <LocationCityIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Station Personnel
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#191c1a' }}>
                {stats.stationCount}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#ffffff', border: '1px solid #e0e2db', borderRadius: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: 'rgba(46, 125, 50, 0.1)', color: '#2e7d32', width: 44, height: 44 }}>
              <CheckCircleOutlineIcon />
            </Avatar>
            <Box>
              <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Active Accounts
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#2e7d32' }}>
                {stats.activeCount} <Typography component="span" variant="caption" sx={{ color: '#56615b' }}>/ {stats.total}</Typography>
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Search & Filter Toolbar */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: '#ffffff', borderRadius: 0, border: '1px solid #e0e2db', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justify: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, flexGrow: 1 }}>
          <TextField
            size="small"
            placeholder="Search by name, @username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: '#56615b' }} />
                </InputAdornment>
              ),
            }}
            sx={{
              width: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
                bgcolor: '#faf8f5',
              },
            }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Role Filter</InputLabel>
            <Select value={roleFilter} label="Role Filter" onChange={(e) => setRoleFilter(e.target.value)} sx={{ borderRadius: 0 }}>
              <MenuItem value="ALL">All Roles</MenuItem>
              <MenuItem value="SYSTEM_ADMIN">SYSTEM_ADMIN</MenuItem>
              <MenuItem value="CENTRAL_STORE">CENTRAL_STORE</MenuItem>
              <MenuItem value="DD_PROCUREMENT">DD_PROCUREMENT</MenuItem>
              <MenuItem value="CSO">CSO</MenuItem>
              <MenuItem value="STORE_OFFICER">STORE_OFFICER</MenuItem>
              <MenuItem value="STORE_CLERK">STORE_CLERK</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)} sx={{ borderRadius: 0 }}>
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active Only</MenuItem>
              <MenuItem value="INACTIVE">Deactivated Only</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Chip
          label={`Showing ${filteredUsers.length} of ${usersList.length} Accounts`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 700, color: '#1e5631', borderColor: '#1e5631' }}
        />
      </Paper>

      {/* Styled Data Table Container */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 0,
          border: '1px solid #e0e2db',
          bgcolor: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <Table size="medium">
          <TableHead sx={{ bgcolor: '#1e5631' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 1.8, fontSize: '0.82rem' }}>User Profile</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 1.8, fontSize: '0.82rem' }}>Email Address</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 1.8, fontSize: '0.82rem' }}>System Role</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 1.8, fontSize: '0.82rem' }}>Station Scope</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 1.8, fontSize: '0.82rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 1.8, fontSize: '0.82rem' }}>2FA Security</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff', py: 1.8, fontSize: '0.82rem', textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#56615b' }}>
                    No users matching search filters found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = currentUserMe?.id === u.id;
                const userActive = u.isActive !== false;
                const rStyle = roleColors[u.role] || { color: 'default', bg: '#f5f5f5', text: '#616161' };

                return (
                  <TableRow
                    key={u.id}
                    hover
                    sx={{
                      transition: 'all 0.15s ease-in-out',
                      bgcolor: userActive ? '#ffffff' : '#fafafa',
                      '&:hover': {
                        bgcolor: 'rgba(30, 86, 49, 0.03) !important',
                      },
                    }}
                  >
                    {/* User Profile (Avatar + Full Name + Username) */}
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
                        <Avatar
                          sx={{
                            bgcolor: userActive ? rStyle.bg : '#e0e0e0',
                            color: userActive ? rStyle.text : '#757575',
                            fontWeight: 900,
                            fontSize: '0.85rem',
                            width: 40,
                            height: 40,
                            border: `1.5px solid ${userActive ? rStyle.text : '#9e9e9e'}`,
                          }}
                        >
                          {getInitials(u.fullName)}
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: userActive ? '#191c1a' : '#757575', lineHeight: 1.2 }}>
                              {u.fullName}
                            </Typography>
                            {isSelf && (
                              <Chip label="You" size="small" color="primary" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800, bgcolor: '#1e5631' }} />
                            )}
                          </Box>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e5631', display: 'block', mt: 0.2 }}>
                            @{u.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Email */}
                    <TableCell sx={{ color: '#56615b', fontWeight: 600, fontSize: '0.82rem' }}>
                      {u.email ? u.email : <Typography variant="caption" sx={{ color: '#9e9e9e', fontStyle: 'italic' }}>No Email Provided</Typography>}
                    </TableCell>

                    {/* System Role */}
                    <TableCell>
                      <Chip
                        label={u.role}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.7rem',
                          bgcolor: rStyle.bg,
                          color: rStyle.text,
                          border: `1px solid ${rStyle.text}33`,
                          px: 0.5,
                        }}
                      />
                    </TableCell>

                    {/* Station Scope */}
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#191c1a' }}>
                      {u.station ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <LocationCityIcon fontSize="small" sx={{ color: '#1e5631', fontSize: '1.1rem' }} />
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.82rem' }}>
                            {u.station.name} <Typography component="span" variant="caption" sx={{ color: '#56615b', fontWeight: 800 }}>({u.station.code})</Typography>
                          </Typography>
                        </Box>
                      ) : (
                        <Chip label="National HQ Scope" size="small" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.68rem', color: '#1e5631', borderColor: '#1e5631' }} />
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {userActive ? (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: '0.85rem !important', color: '#2e7d32 !important' }} />}
                          label="Active"
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.7rem', bgcolor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }}
                        />
                      ) : (
                        <Chip
                          icon={<BlockIcon sx={{ fontSize: '0.85rem !important', color: '#c62828 !important' }} />}
                          label="Deactivated"
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.7rem', bgcolor: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a' }}
                        />
                      )}
                    </TableCell>

                    {/* 2FA Protection */}
                    <TableCell>
                      {u.twoFactorEnabled ? (
                        <Chip
                          icon={<VerifiedUserIcon sx={{ fontSize: '0.85rem !important' }} />}
                          label="Protected"
                          color="success"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 800, fontSize: '0.68rem' }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>Disabled</Typography>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Edit User Access & Scope">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(u)}
                            sx={{
                              bgcolor: 'rgba(30, 86, 49, 0.08)',
                              color: '#1e5631',
                              '&:hover': { bgcolor: 'rgba(30, 86, 49, 0.2)' },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={userActive ? (isSelf ? 'Cannot deactivate logged-in self' : 'Deactivate User Account') : 'Activate User Account'}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={statusUpdatingId === u.id || isSelf}
                              onClick={() => handleToggleActive(u)}
                              sx={{
                                bgcolor: userActive ? 'rgba(237, 108, 2, 0.1)' : 'rgba(46, 125, 50, 0.1)',
                                color: userActive ? '#ed6c02' : '#2e7d32',
                                '&:hover': { bgcolor: userActive ? 'rgba(237, 108, 2, 0.25)' : 'rgba(46, 125, 50, 0.25)' },
                              }}
                            >
                              {userActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title={isSelf ? 'Cannot delete logged-in self' : 'Remove Account Access'}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={isSelf}
                              onClick={() => setDeletingUser(u)}
                              sx={{
                                bgcolor: 'rgba(211, 47, 47, 0.08)',
                                color: '#d32f2f',
                                '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.2)' },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Provision User Account Modal */}
      {showCreateModal && (
        <Dialog open maxWidth="sm" fullWidth onClose={() => setShowCreateModal(false)} PaperProps={{ sx: { borderRadius: 0 } }}>
          <DialogTitle sx={{ fontWeight: 900, color: '#191c1a', pb: 1 }}>Provision New User Account</DialogTitle>
          <Divider />
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" id="create-user-form" onSubmit={handleCreateUser} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Username" required value={username} onChange={(e) => setUsername(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
              </Grid>

              <TextField fullWidth size="small" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>System Role</InputLabel>
                    <Select value={role} label="System Role" onChange={(e) => setRole(e.target.value)} sx={{ borderRadius: 2 }}>
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
                      <Select value={stationId} label="Station Scope" onChange={(e) => setStationId(e.target.value)} sx={{ borderRadius: 2 }}>
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

              <TextField fullWidth size="small" label="Initial Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button variant="outlined" onClick={() => setShowCreateModal(false)} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button type="submit" form="create-user-form" variant="contained" disabled={saving} sx={{ bgcolor: '#1e5631', color: '#ffffff', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#153e23' } }}>
              {saving ? 'Provisioning...' : 'Provision Account'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Edit User Account Modal */}
      {editingUser && (
        <Dialog open maxWidth="sm" fullWidth onClose={() => setEditingUser(null)} PaperProps={{ sx: { borderRadius: 0 } }}>
          <DialogTitle sx={{ fontWeight: 900, color: '#191c1a', pb: 1 }}>
            Edit User Account (@{editingUser.username})
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" id="edit-user-form" onSubmit={handleUpdateUser} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Username" disabled value={username} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Grid>
              </Grid>

              <TextField fullWidth size="small" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>System Role</InputLabel>
                    <Select value={role} label="System Role" onChange={(e) => setRole(e.target.value)} sx={{ borderRadius: 2 }}>
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
                      <Select value={stationId} label="Station Scope" onChange={(e) => setStationId(e.target.value)} sx={{ borderRadius: 2 }}>
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
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={currentUserMe?.id === editingUser.id} color="success" />}
                label={isActive ? 'Account Status: Active' : 'Account Status: Deactivated'}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button variant="outlined" onClick={() => setEditingUser(null)} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button type="submit" form="edit-user-form" variant="contained" disabled={saving} sx={{ bgcolor: '#1e5631', color: '#ffffff', fontWeight: 800, borderRadius: 2, '&:hover': { bgcolor: '#153e23' } }}>
              {saving ? 'Saving...' : 'Save User Access Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete User Confirmation Dialog */}
      {deletingUser && (
        <Dialog open maxWidth="xs" fullWidth onClose={() => setDeletingUser(null)} PaperProps={{ sx: { borderRadius: 0 } }}>
          <DialogTitle sx={{ fontWeight: 900, color: '#c62828', display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" /> Confirm Access Removal
          </DialogTitle>
          <Divider />
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ color: '#191c1a', mb: 1 }}>
              Are you sure you want to remove user account access for <strong>{deletingUser.fullName}</strong> (<code>@{deletingUser.username}</code>)?
            </Typography>
            <Typography variant="caption" sx={{ color: '#56615b', display: 'block' }}>
              This action will delete the account from the RBAC User Registry. The user will immediately lose access to the portal.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button variant="outlined" onClick={() => setDeletingUser(null)} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button variant="contained" color="error" disabled={saving} onClick={handleConfirmDelete} sx={{ fontWeight: 800, borderRadius: 2 }}>
              {saving ? 'Removing...' : 'Remove User Account'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
