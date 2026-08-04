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
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddIcon from '@mui/icons-material/Add';

export default function DistributionsPage() {
  const [distributions, setDistributions] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [selectedStationId, setSelectedStationId] = useState('');
  const [notes, setNotes] = useState('');
  const [distItems, setDistItems] = useState<any[]>([{ itemId: '', sizeId: '', issuedQty: 10 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [distRes, stRes, catRes, userRes] = await Promise.all([
        fetch('/api/distributions'),
        fetch('/api/stations'),
        fetch('/api/kit-items'),
        fetch('/api/auth/me'),
      ]);

      const dData = await distRes.json();
      const sData = await stRes.json();
      const cData = await catRes.json();
      const uData = await userRes.json();

      setDistributions(dData.distributions || []);
      setStations(sData.stations || []);
      if (sData.stations?.length > 0) setSelectedStationId(sData.stations[0].id);
      setItemsCatalog(cData.items || []);
      setCurrentUser(uData.user || null);
    } catch (err) {
      console.error('Failed to load distributions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItemRow = () => {
    setDistItems([...distItems, { itemId: '', sizeId: '', issuedQty: 10 }]);
  };

  const handleCreateDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stationId: selectedStationId,
          notes,
          items: distItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to draft distribution');

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStateTransition = async (distributionId: string, targetStatus: string, comments?: string) => {
    try {
      const res = await fetch('/api/distributions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distributionId, targetStatus, comments }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'State transition failed');

      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const renderStatusChip = (status: string) => {
    const map: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
      DRAFT: { label: 'Draft Allocation', color: 'default' },
      PENDING_DD_APPROVAL: { label: 'Pending DD Approval', color: 'warning' },
      APPROVED: { label: 'Approved by DD', color: 'info' },
      ISSUED: { label: 'Shipment Issued', color: 'success' },
      CANCELLED: { label: 'Cancelled', color: 'error' },
    };
    const b = map[status] || { label: status, color: 'default' };
    return <Chip label={b.label} color={b.color} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: 400, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Loading HQ Multi-Stage Distributions...
        </Typography>
      </Box>
    );
  }

  const isCentralStore = currentUser?.role === 'CENTRAL_STORE' || currentUser?.role === 'SYSTEM_ADMIN';
  const isDD = currentUser?.role === 'DD_PROCUREMENT' || currentUser?.role === 'SYSTEM_ADMIN';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justify: 'space-between', gap: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingIcon color="primary" /> HQ Multi-Stage Distributions
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Central Warehouse Stock Allocation, DD Procurement Signoff & Auto-Deducting Dispatch Execution
          </Typography>
        </Box>

        {isCentralStore && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setShowModal(true);
              setError('');
            }}
          >
            Draft Distribution Plan
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1e5631' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Dispatch Ref</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Destination ASF Station</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Items Allocated</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Notes</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: '#ffffff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {distributions.map((d) => (
              <TableRow key={d.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main' }}>
                  {d.dispatchNumber}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{d.station?.name}</TableCell>
                <TableCell>
                  {d.items?.map((it: any, idx: number) => (
                    <Typography key={idx} variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                      {it.item?.name} ({it.size?.sizeLabel || 'Standard'}) - {it.issuedQty} units
                    </Typography>
                  ))}
                </TableCell>
                <TableCell>{renderStatusChip(d.status)}</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{d.notes || 'N/A'}</TableCell>
                <TableCell align="right">
                  {isCentralStore && d.status === 'DRAFT' && (
                    <Button
                      variant="contained"
                      color="warning"
                      size="small"
                      onClick={() => handleStateTransition(d.id, 'PENDING_DD_APPROVAL', 'Submitted to DD Procurement')}
                    >
                      Submit to DD
                    </Button>
                  )}

                  {isDD && d.status === 'PENDING_DD_APPROVAL' && (
                    <Button
                      variant="contained"
                      color="info"
                      size="small"
                      onClick={() => handleStateTransition(d.id, 'APPROVED', 'Approved by DD Procurement')}
                    >
                      Approve Allocation
                    </Button>
                  )}

                  {isCentralStore && d.status === 'APPROVED' && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleStateTransition(d.id, 'ISSUED', 'Dispatched shipment and deducted stock')}
                    >
                      Execute Dispatch
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showModal && (
        <Dialog open maxWidth="sm" fullWidth onClose={() => setShowModal(false)}>
          <DialogTitle sx={{ fontWeight: 800 }}>Draft Distribution Allocation</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && <Typography variant="caption" color="error">{error}</Typography>}

            <Box component="form" onSubmit={handleCreateDistribution} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Destination ASF Station</InputLabel>
                <Select value={selectedStationId} label="Destination ASF Station" onChange={(e) => setSelectedStationId(e.target.value)}>
                  {stations.map((st) => (
                    <MenuItem key={st.id} value={st.id}>
                      {st.name} ({st.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Dispatch Notes / References"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <Box sx={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800 }}>
                  Allocated Items & Quantities
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={handleAddItemRow}>
                  Add Row
                </Button>
              </Box>

              {distItems.map((row, idx) => {
                const selectedCat = itemsCatalog.find((i) => i.id === row.itemId);
                return (
                  <Paper key={idx} variant="outlined" sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={5}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Item</InputLabel>
                          <Select
                            value={row.itemId}
                            label="Item"
                            onChange={(e) => {
                              const list = [...distItems];
                              list[idx].itemId = e.target.value;
                              setDistItems(list);
                            }}
                          >
                            {itemsCatalog.map((it) => (
                              <MenuItem key={it.id} value={it.id}>
                                {it.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Size</InputLabel>
                          <Select
                            value={row.sizeId}
                            label="Size"
                            onChange={(e) => {
                              const list = [...distItems];
                              list[idx].sizeId = e.target.value;
                              setDistItems(list);
                            }}
                          >
                            <MenuItem value="">Standard</MenuItem>
                            {selectedCat?.sizes?.map((sz: any) => (
                              <MenuItem key={sz.id} value={sz.id}>
                                {sz.sizeLabel}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Qty"
                          type="number"
                          value={row.issuedQty}
                          onChange={(e) => {
                            const list = [...distItems];
                            list[idx].issuedQty = e.target.value;
                            setDistItems(list);
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                );
              })}

              <Box sx={{ display: 'flex', justify: 'flex-end', gap: 2, pt: 2 }}>
                <Button variant="outlined" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Draft'}
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
