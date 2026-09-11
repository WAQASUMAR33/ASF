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
  Alert,
  IconButton,
  Grid,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import { checkLifecycleLock } from '@/lib/entitlement';

export default function DemandsPage() {
  const [demands, setDemands] = useState<any[]>([]);
  const [itemsCatalog, setItemsCatalog] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [filterStation, setFilterStation] = useState('ALL');

  // Wizard state
  const [targetStationId, setTargetStationId] = useState('');
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [selectedItems, setSelectedItems] = useState<any[]>([
    { itemId: '', sizeId: '', customMeasurement: '', demandedQuantity: 1, lastReceiptDate: '', lastReceivedQty: 0 },
  ]);
  const [wizardError, setWizardError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [demandsRes, catalogRes, userRes, stationsRes] = await Promise.all([
        fetch(`/api/demands${filterStation !== 'ALL' ? `?stationId=${filterStation}` : ''}`),
        fetch('/api/kit-items'),
        fetch('/api/auth/me'),
        fetch('/api/stations'),
      ]);

      const dData = await demandsRes.json();
      const cData = await catalogRes.json();
      const uData = await userRes.json();
      const sData = await stationsRes.json();

      setDemands(dData.demands || []);
      setItemsCatalog(cData.items || []);
      setCurrentUser(uData.user || null);
      setStations(sData.stations || []);
      if (sData.stations?.length > 0 && !targetStationId) {
        setTargetStationId(uData.user?.stationId || sData.stations[0].id);
      }
    } catch (err) {
      console.error('Error fetching demand data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStation]);

  const handleAddItemRow = () => {
    setSelectedItems([
      ...selectedItems,
      { itemId: '', sizeId: '', customMeasurement: '', demandedQuantity: 1, lastReceiptDate: '', lastReceivedQty: 0 },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    const list = [...selectedItems];
    list.splice(index, 1);
    setSelectedItems(list);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const list = [...selectedItems];
    list[index][field] = value;
    setSelectedItems(list);
  };

  const handleCreateDemand = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscalYear,
          items: selectedItems,
          stationId: currentUser?.stationId || targetStationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          throw new Error(data.details.join(' | '));
        }
        throw new Error(data.error || 'Failed to submit demand');
      }

      setShowWizard(false);
      fetchData();
    } catch (err: any) {
      setWizardError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStateTransition = async (demandId: string, targetStatus: string, comments?: string) => {
    try {
      const res = await fetch('/api/demands', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandId, targetStatus, comments }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transition failed');

      fetchData();
      if (selectedDemand) setSelectedDemand(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const renderStatusChip = (status: string) => {
    const map: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
      DRAFT: { label: 'Draft', color: 'default' },
      PENDING_STORE_OFFICER: { label: 'Pending Store Officer', color: 'warning' },
      PENDING_CSO: { label: 'Pending CSO Endorsement', color: 'secondary' },
      APPROVED_BY_STATION: { label: 'Approved by Station', color: 'success' },
      RETURNED_TO_CLERK: { label: 'Returned to Clerk', color: 'error' },
      HQ_CONSOLIDATED: { label: 'HQ Consolidated', color: 'info' },
    };
    const b = map[status] || { label: status, color: 'default' };
    return <Chip label={b.label} color={b.color} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: 400, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Loading Station Demands...
        </Typography>
      </Box>
    );
  }

  const canDraft = ['STORE_CLERK', 'STORE_OFFICER', 'SYSTEM_ADMIN'].includes(currentUser?.role);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, borderBottom: '1px solid #e0e2db', pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIcon color="primary" /> Station Demand Lifecycle
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Station Level Demands, Entitlement Ceiling Verification & Replacement Lifecycle Lock Enforcement
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {['DD_PROCUREMENT', 'CENTRAL_STORE', 'SYSTEM_ADMIN'].includes(currentUser?.role) && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select value={filterStation} onChange={(e) => setFilterStation(e.target.value)}>
                <MenuItem value="ALL">All Stations (National View)</MenuItem>
                {stations.map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    {st.name} ({st.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {canDraft && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => {
                setShowWizard(true);
                setWizardError('');
              }}
            >
              Draft Station Demand
            </Button>
          )}
        </Box>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1e5631' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Demand Ref</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>ASF Station</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Fiscal Year</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Items</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>State</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Created Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: '#ffffff' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {demands.length > 0 ? (
              demands.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main' }}>
                    {d.demandNumber}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{d.station?.name}</TableCell>
                  <TableCell>{d.fiscalYear}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{d.items?.length || 0} Line Items</TableCell>
                  <TableCell>{renderStatusChip(d.status)}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#191c1a', whiteSpace: 'nowrap' }}>
                    {d.createdAt
                      ? new Date(d.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => setSelectedDemand(d)}
                    >
                      Process
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No station demands found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Process Demand Dialog */}
      {selectedDemand && (
        <Dialog open maxWidth="md" fullWidth onClose={() => setSelectedDemand(null)}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', fontFamily: 'monospace' }}>
                {selectedDemand.demandNumber}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Station: {selectedDemand.station?.name} • Created Date: {selectedDemand.createdAt ? new Date(selectedDemand.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </Typography>
            </Box>
            <Button size="small" onClick={() => setSelectedDemand(null)}>✕ Close</Button>
          </DialogTitle>

          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {selectedDemand.rejectionNote && (
              <Alert severity="error" icon={<WarningAmberIcon />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Returned Note:</Typography>
                {selectedDemand.rejectionNote}
              </Alert>
            )}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#1e5631' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>Kit Item</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>Size / Spec</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>Max Entitlement</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#ffffff' }}>Demanded Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedDemand.items?.map((it: any) => (
                    <TableRow key={it.id}>
                      <TableCell sx={{ fontWeight: 600 }}>{it.item?.name} ({it.item?.itemCode})</TableCell>
                      <TableCell>{it.size?.sizeLabel || it.customMeasurement || 'Standard'}</TableCell>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>{it.calculatedMaxAllowed}</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>{it.demandedQuantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>

          <DialogActions sx={{ p: 2, gap: 1 }}>
            {currentUser?.role === 'STORE_CLERK' && (selectedDemand.status === 'DRAFT' || selectedDemand.status === 'RETURNED_TO_CLERK') && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleStateTransition(selectedDemand.id, 'PENDING_STORE_OFFICER', 'Submitted for Store Officer review')}
              >
                Submit to Store Officer
              </Button>
            )}

            {currentUser?.role === 'STORE_OFFICER' && (selectedDemand.status === 'PENDING_STORE_OFFICER' || selectedDemand.status === 'DRAFT' || selectedDemand.status === 'RETURNED_TO_CLERK') && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const reason = prompt('Enter return reason for clerk:');
                    if (reason) handleStateTransition(selectedDemand.id, 'RETURNED_TO_CLERK', reason);
                  }}
                >
                  Return to Clerk
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleStateTransition(selectedDemand.id, 'PENDING_CSO', 'Approved & Endorsed by Store Officer')}
                >
                  Approve & Forward to CSO
                </Button>
              </>
            )}

            {currentUser?.role === 'CSO' && selectedDemand.status === 'PENDING_CSO' && (
              <>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    const reason = prompt('Enter return reason for Store Officer:');
                    if (reason) handleStateTransition(selectedDemand.id, 'PENDING_STORE_OFFICER', reason);
                  }}
                >
                  Return to Store Officer
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    const reason = prompt('Enter return reason for Clerk:');
                    if (reason) handleStateTransition(selectedDemand.id, 'RETURNED_TO_CLERK', reason);
                  }}
                >
                  Return to Clerk
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleStateTransition(selectedDemand.id, 'APPROVED_BY_STATION', 'CSO Final Endorsement')}
                >
                  Final Station Endorsement
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

      {/* Draft Demand Wizard Dialog */}
      {showWizard && (
        <Dialog open maxWidth="md" fullWidth onClose={() => setShowWizard(false)}>
          <DialogTitle sx={{ fontWeight: 800 }}>Draft Station Demand Wizard</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {wizardError && <Alert severity="error">{wizardError}</Alert>}

            <Box component="form" onSubmit={handleCreateDemand} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fiscal Year"
                    type="number"
                    size="small"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(parseInt(e.target.value, 10))}
                  />
                </Grid>

                {(!currentUser?.stationId || ['SYSTEM_ADMIN', 'DD_PROCUREMENT', 'CENTRAL_STORE'].includes(currentUser?.role)) && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Target ASF Station</InputLabel>
                      <Select
                        value={targetStationId}
                        label="Target ASF Station"
                        onChange={(e) => setTargetStationId(e.target.value)}
                        required
                      >
                        {stations.map((st) => (
                          <MenuItem key={st.id} value={st.id}>
                            {st.name} ({st.code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 800 }}>
                  Demanded Line Items
                </Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={handleAddItemRow}>
                  Add Item
                </Button>
              </Box>

              {selectedItems.map((row, idx) => {
                const selectedCatalogItem = itemsCatalog.find((i) => i.id === row.itemId);
                const targetSt = stations.find((s) => s.id === (currentUser?.stationId || targetStationId));
                const totalManpower = targetSt?.manpower?.totalHeld || 1000;
                const scale = Number(selectedCatalogItem?.scaleOfIssue) || 1.0;
                const authCeiling = Math.floor(scale * totalManpower);

                const lockCheck = selectedCatalogItem
                  ? checkLifecycleLock(
                      row.lastReceiptDate || row.lastIssuedDate,
                      selectedCatalogItem.lifeCycleYears || 1,
                      authCeiling,
                      row.lastReceivedQty || 0
                    )
                  : null;

                const isExceeding = lockCheck && Number(row.demandedQuantity) > lockCheck.netMaxAllowed;

                return (
                  <Paper key={idx} variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Kit Item</InputLabel>
                          <Select
                            value={row.itemId}
                            label="Kit Item"
                            onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)}
                            required
                          >
                            {itemsCatalog.map((item) => (
                              <MenuItem key={item.id} value={item.id}>
                                {item.name} ({item.itemCode})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={2.5}>
                        {selectedCatalogItem?.requiresMeasurement ? (
                          <TextField
                            fullWidth
                            size="small"
                            label="Custom Spec"
                            placeholder="Chest 38, Shoulder 17"
                            value={row.customMeasurement}
                            onChange={(e) => handleItemChange(idx, 'customMeasurement', e.target.value)}
                          />
                        ) : (
                          <FormControl fullWidth size="small">
                            <InputLabel>Size</InputLabel>
                            <Select
                              value={row.sizeId}
                              label="Size"
                              onChange={(e) => handleItemChange(idx, 'sizeId', e.target.value)}
                            >
                              <MenuItem value="">Standard / N/A</MenuItem>
                              {selectedCatalogItem?.sizes?.map((sz: any) => (
                                <MenuItem key={sz.id} value={sz.id}>
                                  {sz.sizeLabel}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Grid>

                      <Grid item xs={12} sm={2.5}>
                        <TextField
                          type="date"
                          fullWidth
                          size="small"
                          label="Last Receipt Date"
                          InputLabelProps={{ shrink: true }}
                          value={row.lastReceiptDate || row.lastIssuedDate || ''}
                          onChange={(e) => {
                            handleItemChange(idx, 'lastReceiptDate', e.target.value);
                            handleItemChange(idx, 'lastIssuedDate', e.target.value);
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Last Received Qty"
                          type="number"
                          value={row.lastReceivedQty || 0}
                          onChange={(e) => handleItemChange(idx, 'lastReceivedQty', parseInt(e.target.value, 10) || 0)}
                        />
                      </Grid>

                      <Grid item xs={12} sm={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Demanded Qty"
                          type="number"
                          value={row.demandedQuantity}
                          onChange={(e) => handleItemChange(idx, 'demandedQuantity', parseInt(e.target.value, 10) || 0)}
                          required
                        />
                      </Grid>
                    </Grid>

                    {/* Item Specifications Summary Card */}
                    {selectedCatalogItem && (
                      <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#faf8f5', borderColor: '#e0e2db' }}>
                        <Grid container spacing={1.5} alignItems="center">
                          <Grid item xs={6} sm={3}>
                            <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, display: 'block' }}>
                              Item Code / Name
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e5631', fontFamily: 'monospace' }}>
                              {selectedCatalogItem.itemCode}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {selectedCatalogItem.name}
                            </Typography>
                          </Grid>

                          <Grid item xs={6} sm={2.5}>
                            <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, display: 'block' }}>
                              Category & Gender
                            </Typography>
                            <Chip
                              label={selectedCatalogItem.category?.name || 'General'}
                              size="small"
                              sx={{ fontWeight: 800, fontSize: '0.65rem', height: 18, mr: 0.5 }}
                            />
                            <Chip
                              label={selectedCatalogItem.targetGender}
                              size="small"
                              variant="outlined"
                              sx={{ fontWeight: 800, fontSize: '0.65rem', height: 18 }}
                            />
                          </Grid>

                          <Grid item xs={6} sm={2.5}>
                            <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, display: 'block' }}>
                              Unit & Scale of Issue
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#191c1a' }}>
                              Unit: {selectedCatalogItem.unitOfIssue} • Scale: {selectedCatalogItem.scaleOfIssue}
                            </Typography>
                          </Grid>

                          <Grid item xs={6} sm={2}>
                            <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, display: 'block' }}>
                              Life Cycle / Replacement
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#2d6a4f' }}>
                              {selectedCatalogItem.lifeCycleYears} Year(s) Life
                            </Typography>
                          </Grid>

                          <Grid item xs={12} sm={2}>
                            <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, display: 'block' }}>
                              Available Sizes
                            </Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e5631' }}>
                              {selectedCatalogItem.sizes?.length > 0
                                ? selectedCatalogItem.sizes.map((s: any) => s.sizeLabel).join(', ')
                                : 'Standard / Free Size'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    )}

                    {/* Entitlement & Lifecycle Lock Breakdown Banner */}
                    {selectedCatalogItem && lockCheck && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1, pt: 1, borderTop: '1px solid #e0e2db' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                          <Chip
                            label={`Auth Ceiling: ${authCeiling} No.`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#1e5631', borderColor: '#1e5631' }}
                          />
                          <Chip
                            label={`Last Received: ${row.lastReceivedQty || 0} No.`}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 800, fontSize: '0.68rem', color: '#56615b' }}
                          />
                          <Chip
                            label={`Net Max Allowed: ${lockCheck.netMaxAllowed} No.`}
                            size="small"
                            color={isExceeding ? 'error' : 'success'}
                            sx={{ fontWeight: 900, fontSize: '0.7rem' }}
                          />
                          {lockCheck.isLocked && (
                            <Chip
                              icon={<LockIcon sx={{ fontSize: '0.85rem !important' }} />}
                              label={`Locked until ${lockCheck.nextEligibleDate?.toISOString().split('T')[0]}`}
                              color="error"
                              size="small"
                              sx={{ fontWeight: 800 }}
                            />
                          )}
                        </Box>

                        {selectedItems.length > 1 && (
                          <IconButton size="small" color="error" onClick={() => handleRemoveItemRow(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </Paper>
                );
              })}

              <Box sx={{ display: 'flex', justify: 'flex-end', gap: 2 }}>
                <Button variant="outlined" onClick={() => setShowWizard(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Create Station Demand Draft'}
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
