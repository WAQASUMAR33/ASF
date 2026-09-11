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
  FormControlLabel,
  Checkbox,
  Grid,
  IconButton,
  Tooltip,
} from '@mui/material';
import CategoryIcon from '@mui/icons-material/Category';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

export default function CatalogPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form state
  const [itemCode, setItemCode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unitOfIssue, setUnitOfIssue] = useState('NO');
  const [scaleOfIssue, setScaleOfIssue] = useState('1.0');
  const [lifeCycleYears, setLifeCycleYears] = useState('2');
  const [targetGender, setTargetGender] = useState('UNISEX');
  const [requiresMeasurement, setRequiresMeasurement] = useState(false);
  const [specSheetUrl, setSpecSheetUrl] = useState('');
  const [sizeInput, setSizeInput] = useState('Small (S), Medium (M), Large (L), X-Large (XL)');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Central Stock Modal State
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockItemId, setSelectedStockItemId] = useState('');
  const [selectedStockSizeId, setSelectedStockSizeId] = useState('');
  const [stockAvailableQty, setStockAvailableQty] = useState<number>(0);
  const [updatingStock, setUpdatingStock] = useState(false);

  // Category Management Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const [catRes, userRes] = await Promise.all([fetch('/api/kit-items'), fetch('/api/auth/me')]);
      const cData = await catRes.json();
      const uData = await userRes.json();

      setItems(cData.items || []);
      setCategories(cData.categories || []);
      if (cData.categories?.length > 0 && !categoryId) setCategoryId(cData.categories[0].id);
      setCurrentUser(uData.user || null);
    } catch (err) {
      console.error('Failed to load catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setItemCode('');
    setName('');
    setUnitOfIssue('NO');
    setScaleOfIssue('1.0');
    setLifeCycleYears('2');
    setTargetGender('UNISEX');
    setRequiresMeasurement(false);
    setSpecSheetUrl('');
    setSizeInput('Small (S), Medium (M), Large (L), X-Large (XL)');
    setError('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setItemCode(item.itemCode);
    setName(item.name);
    setCategoryId(item.categoryId);
    setUnitOfIssue(item.unitOfIssue);
    setScaleOfIssue(item.scaleOfIssue.toString());
    setLifeCycleYears(item.lifeCycleYears.toString());
    setTargetGender(item.targetGender);
    setRequiresMeasurement(item.requiresMeasurement);
    setSpecSheetUrl(item.specSheetUrl || '');
    setSizeInput(item.sizes?.map((s: any) => s.sizeLabel).join(', ') || '');
    setError('');
    setShowModal(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const sizesArray = sizeInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/kit-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem?.id,
          itemCode,
          name,
          categoryId,
          unitOfIssue,
          scaleOfIssue,
          lifeCycleYears,
          targetGender,
          requiresMeasurement,
          specSheetUrl,
          sizes: sizesArray,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save kit item');

      setShowModal(false);
      fetchCatalog();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this kit item from the master catalog?')) return;
    try {
      const res = await fetch(`/api/kit-items?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete item');
      }
      fetchCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleWipeDummyData = async () => {
    if (!confirm('WARNING: This will remove ALL catalog items and test demands to allow fresh data entry. Proceed?')) return;
    try {
      const res = await fetch('/api/kit-items?wipeAll=true', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to wipe dummy data');
      }
      fetchCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isHQ = ['DD_PROCUREMENT', 'CENTRAL_STORE', 'SYSTEM_ADMIN'].includes(currentUser?.role);

  const handleUpdateCentralStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingStock(true);
    try {
      const res = await fetch('/api/central-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: selectedStockItemId,
          sizeId: selectedStockSizeId || null,
          availableQty: stockAvailableQty,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update central stock');
      }

      setShowStockModal(false);
      fetchCatalog();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, description: newCatDesc }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create category');
      }

      setNewCatName('');
      setNewCatDesc('');
      fetchCatalog();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/categories?id=${catId}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to delete category');
      }
      fetchCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: 400, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress sx={{ color: '#1e5631' }} />
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Loading Kit Item Catalog (MDM)...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justify: 'space-between', gap: 2, borderBottom: '1px solid #e0e2db', pb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e5631', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CategoryIcon sx={{ color: '#1e5631' }} /> Kit Item Catalog (MDM) & Central Warehouse Stock
          </Typography>
          <Typography variant="caption" sx={{ color: '#666666' }}>
            Master Catalog, Central Available Stock Management, Dynamic Size Charts & Specifications
          </Typography>
        </Box>

        {isHQ && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={() => setShowCategoryModal(true)}
            >
              Category Management
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="small"
              onClick={() => {
                if (items.length > 0) {
                  setSelectedStockItemId(items[0].id);
                  setStockAvailableQty(items[0].centralStock?.[0]?.availableQty || 0);
                }
                setShowStockModal(true);
              }}
            >
              Update Central Stock
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteSweepIcon />}
              onClick={handleWipeDummyData}
            >
              Clear Dummy Catalog
            </Button>
            <Button
              variant="contained"
              sx={{ bgcolor: '#1e5631', '&:hover': { bgcolor: '#1b4d2e' } }}
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Create New Kit Item
            </Button>
          </Box>
        )}
      </Box>

      <Box sx={{ maxWidth: 360 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by item code or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Box>

      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1e5631' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Item Code</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Kit Name</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Unit</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Scale of Issue</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Life Cycle</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Target Gender</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Available Size Chart</TableCell>
              {isHQ && <TableCell align="right" sx={{ fontWeight: 800, color: '#ffffff' }}>Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isHQ ? 9 : 8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" sx={{ color: '#666666', mb: 1 }}>
                    No kit items found in catalog.
                  </Typography>
                  {isHQ && (
                    <Button variant="contained" size="small" sx={{ bgcolor: '#1e5631', '&:hover': { bgcolor: '#1b4d2e' } }} onClick={handleOpenCreate}>
                      Add Your First Kit Item
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#1e5631' }}>
                    {item.itemCode}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                  <TableCell>{item.category?.name || 'General'}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{item.unitOfIssue}</TableCell>
                  <TableCell sx={{ color: '#27ae60', fontWeight: 700 }}>{item.scaleOfIssue} per head</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{item.lifeCycleYears} Year(s)</TableCell>
                  <TableCell>
                    <Chip label={item.targetGender} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.sizes?.map((sz: any) => (
                        <Chip key={sz.id} label={sz.sizeLabel} size="small" variant="filled" sx={{ fontSize: '0.65rem' }} />
                      ))}
                    </Box>
                  </TableCell>
                  {isHQ && (
                    <TableCell align="right">
                      <Tooltip title="Edit Item">
                        <IconButton size="small" onClick={() => handleOpenEdit(item)} sx={{ color: '#1e5631' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Item">
                        <IconButton size="small" onClick={() => handleDeleteItem(item.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {showModal && (
        <Dialog open maxWidth="sm" fullWidth onClose={() => setShowModal(false)}>
          <DialogTitle sx={{ fontWeight: 800, color: '#1e5631' }}>
            {editingItem ? 'Edit Kit Item Entry' : 'Create Kit Item Entry'}
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {error && <Typography variant="caption" color="error">{error}</Typography>}

            <Box component="form" onSubmit={handleSaveItem} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Item Code"
                    required
                    value={itemCode}
                    onChange={(e) => setItemCode(e.target.value.toUpperCase())}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Kit Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select value={categoryId} label="Category" onChange={(e) => setCategoryId(e.target.value)}>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Unit of Issue</InputLabel>
                    <Select value={unitOfIssue} label="Unit of Issue" onChange={(e) => setUnitOfIssue(e.target.value)}>
                      <MenuItem value="NO">NO (Number)</MenuItem>
                      <MenuItem value="PAIR">PAIR</MenuItem>
                      <MenuItem value="SET">SET</MenuItem>
                      <MenuItem value="METERS">METERS</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Scale of Issue (per head)"
                    type="number"
                    inputProps={{ step: '0.1' }}
                    required
                    value={scaleOfIssue}
                    onChange={(e) => setScaleOfIssue(e.target.value)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Life Cycle (Years)"
                    type="number"
                    required
                    value={lifeCycleYears}
                    onChange={(e) => setLifeCycleYears(e.target.value)}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Target Gender</InputLabel>
                    <Select value={targetGender} label="Target Gender" onChange={(e) => setTargetGender(e.target.value)}>
                      <MenuItem value="UNISEX">UNISEX</MenuItem>
                      <MenuItem value="MALE">MALE ONLY</MenuItem>
                      <MenuItem value="FEMALE">FEMALE ONLY</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={requiresMeasurement}
                        onChange={(e) => setRequiresMeasurement(e.target.checked)}
                      />
                    }
                    label={<Typography variant="caption">Requires Custom Tailor Measurement</Typography>}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                size="small"
                label="Size Labels (Comma Separated)"
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                helperText="e.g. Small (S), Medium (M), Large (L), X-Large (XL)"
              />

              <DialogActions sx={{ px: 0, pt: 2 }}>
                <Button onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: '#1e5631', '&:hover': { bgcolor: '#1b4d2e' } }}>
                  {saving ? 'Saving...' : editingItem ? 'Update Kit Item' : 'Save Kit Item'}
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Central Stock Update Dialog */}
      {showStockModal && (
        <Dialog open maxWidth="xs" fullWidth onClose={() => setShowStockModal(false)}>
          <DialogTitle sx={{ fontWeight: 800, color: '#1e5631' }}>
            Update Central Stock Quantity
          </DialogTitle>
          <DialogContent dividers>
            <Box component="form" onSubmit={handleUpdateCentralStock} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Kit Item</InputLabel>
                <Select
                  value={selectedStockItemId}
                  label="Kit Item"
                  onChange={(e) => {
                    const itemId = e.target.value;
                    setSelectedStockItemId(itemId);
                    const it = items.find((i) => i.id === itemId);
                    setStockAvailableQty(it?.centralStock?.[0]?.availableQty || 0);
                  }}
                  required
                >
                  {items.map((it) => (
                    <MenuItem key={it.id} value={it.id}>
                      {it.itemCode} - {it.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                size="small"
                label="Available Stock Quantity"
                type="number"
                required
                value={stockAvailableQty}
                onChange={(e) => setStockAvailableQty(parseInt(e.target.value, 10) || 0)}
              />

              <DialogActions sx={{ px: 0, pt: 1 }}>
                <Button onClick={() => setShowStockModal(false)}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={updatingStock} sx={{ bgcolor: '#1e5631', '&:hover': { bgcolor: '#1b4d2e' } }}>
                  {updatingStock ? 'Saving...' : 'Update Stock'}
                </Button>
              </DialogActions>
            </Box>
          </DialogContent>
        </Dialog>
      )}

      {/* Category Management Dialog */}
      {showCategoryModal && (
        <Dialog open maxWidth="sm" fullWidth onClose={() => setShowCategoryModal(false)}>
          <DialogTitle sx={{ fontWeight: 800, color: '#1e5631' }}>
            Category Management
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Create Form */}
            <Box component="form" onSubmit={handleCreateCategory} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <TextField
                size="small"
                label="Category Name"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <TextField
                size="small"
                label="Description (Optional)"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                sx={{ flexGrow: 1 }}
              />
              <Button type="submit" variant="contained" disabled={savingCat} sx={{ bgcolor: '#1e5631', py: 0.9 }}>
                Add Category
              </Button>
            </Box>

            {/* Categories List Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#1e5631' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Category Name</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell sx={{ fontWeight: 700, color: '#1e5631' }}>{c.name}</TableCell>
                      <TableCell>{c.description || '—'}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => handleDeleteCategory(c.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button variant="contained" color="primary" onClick={() => setShowCategoryModal(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
