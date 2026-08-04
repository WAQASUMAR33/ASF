'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
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
  CircularProgress,
} from '@mui/material';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import EditIcon from '@mui/icons-material/Edit';

export default function ManpowerPage() {
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingStation, setEditingStation] = useState<any>(null);
  const [heldMale, setHeldMale] = useState(0);
  const [heldFemale, setHeldFemale] = useState(0);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchManpower = async () => {
    setLoading(true);
    try {
      const [stRes, userRes] = await Promise.all([fetch('/api/stations'), fetch('/api/auth/me')]);
      const sData = await stRes.json();
      const uData = await userRes.json();

      setStations(sData.stations || []);
      setCurrentUser(uData.user || null);
    } catch (err) {
      console.error('Failed to load manpower', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManpower();
  }, []);

  const handleUpdateManpower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    setSaving(true);

    try {
      const res = await fetch('/api/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: editingStation.id,
          heldMale,
          heldFemale,
        }),
      });

      if (!res.ok) throw new Error('Failed to update manpower');

      setEditingStation(null);
      fetchManpower();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: 400, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Loading Manpower Matrix across 30+ Stations...
        </Typography>
      </Box>
    );
  }

  const isHQ = ['DD_PROCUREMENT', 'CENTRAL_STORE', 'SYSTEM_ADMIN'].includes(currentUser?.role);

  const filteredStations = stations.filter(
    (st) =>
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationCityIcon color="primary" /> Station Manpower Matrix
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Dynamic Station Headcounts (Male / Female Held) used to calculate Entitlement Ceilings
        </Typography>
      </Box>

      <Box sx={{ maxWidth: 360 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by station code or airport name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1e5631' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Station Code</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Airport Name</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Held Male</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Held Female</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Total Headcount</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: '#ffffff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStations.map((st) => (
              <TableRow key={st.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main' }}>
                  {st.code}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{st.name}</TableCell>
                <TableCell sx={{ color: 'secondary.main', fontWeight: 700 }}>{st.manpower?.heldMale || 0}</TableCell>
                <TableCell sx={{ color: '#f472b6', fontWeight: 700 }}>{st.manpower?.heldFemale || 0}</TableCell>
                <TableCell sx={{ fontWeight: 900, color: 'primary.main' }}>{st.manpower?.totalHeld || 0}</TableCell>
                <TableCell align="right">
                  {isHQ && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => {
                        setEditingStation(st);
                        setHeldMale(st.manpower?.heldMale || 0);
                        setHeldFemale(st.manpower?.heldFemale || 0);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editingStation && (
        <Dialog open maxWidth="xs" fullWidth onClose={() => setEditingStation(null)}>
          <DialogTitle sx={{ fontWeight: 800 }}>Edit {editingStation.name} Headcount</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box component="form" onSubmit={handleUpdateManpower} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Held Male Personnel"
                type="number"
                value={heldMale}
                onChange={(e) => setHeldMale(parseInt(e.target.value, 10) || 0)}
              />

              <TextField
                fullWidth
                size="small"
                label="Held Female Personnel"
                type="number"
                value={heldFemale}
                onChange={(e) => setHeldFemale(parseInt(e.target.value, 10) || 0)}
              />

              <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>Total Calculated Headcount:</Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>{heldMale + heldFemale}</Typography>
              </Paper>

              <Box sx={{ display: 'flex', justify: 'flex-end', gap: 2, pt: 1 }}>
                <Button variant="outlined" onClick={() => setEditingStation(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Headcount'}
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
