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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import LayersIcon from '@mui/icons-material/Layers';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import { downloadCSV } from '@/lib/export';

export default function HQConsolidationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBreakdownItem, setSelectedBreakdownItem] = useState<any>(null);

  const fetchConsolidation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hq-consolidation');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch HQ consolidation', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsolidation();
  }, []);

  const handleExportCSV = () => {
    if (!data?.consolidated) return;
    const exportRows = data.consolidated.map((r: any) => ({
      ItemCode: r.itemCode,
      ItemName: r.itemName,
      Category: r.categoryName,
      Size: r.sizeLabel,
      ConsolidatedDemand: r.totalConsolidatedDemand,
      CentralStock: r.centralStockQty,
      DeficiencyQty: r.deficiency,
      DeficiencyPercent: `${r.deficiencyPercentage}%`,
      Status: r.status,
    }));
    downloadCSV('ASF_HQ_National_Consolidation_Deficiency.csv', exportRows);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading || !data) {
    return (
      <Box sx={{ display: 'flex', height: 400, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Executing HQ National Rollup Engine...
        </Typography>
      </Box>
    );
  }

  const filteredItems = (data.consolidated || []).filter(
    (item: any) =>
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justify: 'space-between', gap: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.08)', pb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <LayersIcon color="secondary" /> HQ Consolidation & Deficiency Engine
            </Typography>
            <Chip label="National Rollup" color="secondary" size="small" sx={{ fontWeight: 700 }} />
          </Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Real-Time Deficiency Formula Calculation & Central Stock Gap Analysis across 30+ ASF Stations
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" color="inherit" size="small" startIcon={<FileDownloadIcon />} onClick={handleExportCSV}>
            Export Excel/CSV
          </Button>
          <Button variant="contained" color="primary" size="small" startIcon={<PrintIcon />} onClick={handlePrintPDF}>
            Print PDF Report
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <Card elevation={1} sx={{ borderLeft: '4px solid #38bdf8' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Consolidated Line Items
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, my: 0.5 }}>
                {data.totalItemsCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={1} sx={{ borderLeft: '4px solid #f43f5e' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Deficient Items
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: 'error.main', my: 0.5 }}>
                {data.totalDeficientCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card elevation={1} sx={{ borderLeft: '4px solid #10b981' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                Deficiency Formula Standard
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, color: 'success.main', fontFamily: 'monospace', mt: 1 }}>
                Deficiency = Demand - Central Stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search */}
      <Box sx={{ maxWidth: 360 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search items by code or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#1e5631' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Item Code</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Kit Description</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Size / Unit</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Consolidated Demand</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Central Stock</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Deficiency Qty</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Deficiency %</TableCell>
              <TableCell sx={{ fontWeight: 800, color: '#ffffff' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: '#ffffff' }}>Breakdown</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.length > 0 ? (
              filteredItems.map((r: any) => (
                <TableRow key={r.key} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main' }}>
                    {r.itemCode}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{r.itemName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{r.categoryName}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>
                    {r.sizeLabel} ({r.unitOfIssue})
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>{r.totalConsolidatedDemand.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: 'secondary.main' }}>{r.centralStockQty.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: r.deficiency > 0 ? 'error.main' : 'success.main' }}>
                    {r.deficiency.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.deficiencyPercentage}%</TableCell>
                  <TableCell>
                    {r.deficiency > 0 ? (
                      <Chip
                        icon={<ReportProblemIcon sx={{ fontSize: '0.9rem !important' }} />}
                        label="DEFICIENT"
                        color="error"
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                      />
                    ) : (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: '0.9rem !important' }} />}
                        label="SUFFICIENT"
                        color="success"
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedBreakdownItem(r)}
                    >
                      Breakdown ({r.stationBreakdown?.length || 0})
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  No approved station demand items found to consolidate.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Breakdown Dialog */}
      {selectedBreakdownItem && (
        <Dialog open maxWidth="sm" fullWidth onClose={() => setSelectedBreakdownItem(null)}>
          <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', fontFamily: 'monospace' }}>
            {selectedBreakdownItem.itemCode} - Station Breakdown
          </DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {selectedBreakdownItem.stationBreakdown?.map((st: any, idx: number) => (
              <Paper key={idx} variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <LocationCityIcon color="primary" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{st.stationName}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>Code: {st.stationCode}</Typography>
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>
                  {st.quantity}
                </Typography>
              </Paper>
            ))}
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}
