'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  FormControl,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { downloadCSV } from '@/lib/export';

function ExecutiveDashboardContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Level Switcher: Administration Level vs Station Level
  const [viewLevel, setViewLevel] = useState<'ADMINISTRATION' | 'STATION'>('ADMINISTRATION');

  // Drill-down wizard states
  const [drillAdmin, setDrillAdmin] = useState<string>('North');
  const [drillStation, setDrillStation] = useState<string>('ALL');

  // Table / Chart view toggle
  const [bottomView, setBottomView] = useState<'TABLE' | 'CHART'>('TABLE');

  // Sync with Sidebar search parameters
  const adminFilter = searchParams.get('administration') || 'ALL';
  const stationFilter = searchParams.get('stationId') || 'ALL';
  const categoryFilter = searchParams.get('categoryId') || 'ALL';

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (adminFilter !== 'ALL') params.set('administration', adminFilter);
      if (stationFilter !== 'ALL') params.set('stationId', stationFilter);
      if (categoryFilter !== 'ALL') params.set('categoryId', categoryFilter);
      params.set('level', viewLevel);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [adminFilter, stationFilter, categoryFilter, viewLevel]);

  const handleExportDetails = () => {
    if (!data?.stationLevelDetails) return;
    downloadCSV(
      `ASF_Station_Level_Inventory_${adminFilter}_${new Date().toISOString().split('T')[0]}.csv`,
      data.stationLevelDetails
    );
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', height: '65vh', alignItems: 'center', justifyContent: 'center', gap: 2, flexDirection: 'column' }}>
        <CircularProgress sx={{ color: '#1e5631' }} />
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e5631' }}>
          Loading ASF Executive Inventory Command Center...
        </Typography>
      </Box>
    );
  }

  const metrics = data?.metrics || {
    totalDemandUnits: 0,
    totalAvailableStockUnits: 0,
    totalDeficiencyUnits: 0,
    fulfillmentRate: 0,
  };

  const administrationMetrics = data?.administrationMetrics || [];
  const stockStatus = data?.stockStatus || {
    totalAvailableStock: 0,
    healthyStock: 0,
    healthyStockPct: 0,
    lowStock: 0,
    lowStockPct: 0,
    outOfStock: 0,
    outOfStockPct: 0,
  };

  const topDeficientStations = data?.topDeficientStations || [];
  const monthlyTrend = data?.monthlyTrend || [];
  const stationLevelDetails = data?.stationLevelDetails || [];
  const filterOptions = data?.filterOptions || {
    administrations: ['Central', 'North', 'South', 'East', 'West'],
    stations: [],
    categories: [],
  };

  // Donut data for Stock Status
  const donutData = [
    { name: 'Healthy Stock', value: stockStatus.healthyStock, color: '#10b981' },
    { name: 'Low Stock', value: stockStatus.lowStock, color: '#f59e0b' },
    { name: 'Out of Stock', value: stockStatus.outOfStock, color: '#ef4444' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}>
      {/* Top Header Row with Level Switcher */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: '#191c1a', letterSpacing: '-0.3px' }}>
            Overall Inventory Status ({viewLevel === 'ADMINISTRATION' ? 'Administration Level' : 'Station Level'})
          </Typography>
          <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 600 }}>
            National Airports Security Force central distribution & station stock allocation overview
          </Typography>
        </Box>

        {/* Administration Level vs Station Level Toggle */}
        <ToggleButtonGroup
          value={viewLevel}
          exclusive
          onChange={(_, val) => {
            if (val) setViewLevel(val);
          }}
          size="small"
          sx={{
            bgcolor: '#ffffff',
            border: '1px solid #e0e2db',
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.6,
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'none',
              border: 'none',
              color: '#56615b',
              '&.Mui-selected': {
                bgcolor: '#2563eb',
                color: '#ffffff',
                '&:hover': { bgcolor: '#1d4ed8' },
              },
            },
          }}
        >
          <ToggleButton value="ADMINISTRATION">Administration Level</ToggleButton>
          <ToggleButton value="STATION">Station Level</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* ─────────────────────────────────────────────────────────────
          1. TOP 4 KPI METRIC CARDS ROW
      ────────────────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        {/* 1. Total Demand */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #e0e2db', bgcolor: '#ffffff', height: '100%', borderRadius: '6px' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2.5 } }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <AssignmentIcon sx={{ fontSize: '1.6rem' }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, display: 'block' }}>
                  Total Demand
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#191c1a', lineHeight: 1.1, my: 0.2 }}>
                  {metrics.totalDemandUnits.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 600 }}>
                  Units
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 2. Total Available Stock */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #d1fae5', bgcolor: '#ecfdf5', height: '100%', borderRadius: '6px' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2.5 } }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <Inventory2Icon sx={{ fontSize: '1.6rem' }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700, display: 'block' }}>
                  Total Available Stock
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#065f46', lineHeight: 1.1, my: 0.2 }}>
                  {metrics.totalAvailableStockUnits.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600 }}>
                  Units
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 3. Total Deficiency */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #fee2e2', bgcolor: '#fff5f5', height: '100%', borderRadius: '6px' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2.5 } }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <WarningAmberIcon sx={{ fontSize: '1.6rem' }} />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700, display: 'block' }}>
                  Total Deficiency
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#991b1b', lineHeight: 1.1, my: 0.2 }}>
                  {metrics.totalDeficiencyUnits.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                  Units
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* 4. Stock Fulfillment Rate with Circular SVG Radial Gauge */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ border: '1px solid #e0e2db', bgcolor: '#ffffff', height: '100%', borderRadius: '6px' }}>
            <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2.5 } }}>
              {/* SVG Circular Progress Gauge */}
              <Box sx={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
                <svg width="54" height="54" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3.8"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.8"
                    strokeDasharray={`${Math.min(100, metrics.fulfillmentRate)}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 700, display: 'block' }}>
                  Stock Fulfillment Rate
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#191c1a', lineHeight: 1.1, my: 0.2 }}>
                  {metrics.fulfillmentRate}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 600 }}>
                  (Available / Demand)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ─────────────────────────────────────────────────────────────
          2. MIDDLE CHARTS ROW (Grouped Bar Chart + Stock Donut Chart)
      ────────────────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        {/* Left Grouped Bar Chart */}
        <Grid item xs={12} lg={7.5}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e0e2db', bgcolor: '#ffffff', borderRadius: '6px', height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#191c1a' }}>
                Demand vs Stock vs Deficiency ({viewLevel === 'ADMINISTRATION' ? 'Administration Level' : 'Station Level'})
              </Typography>
              {/* Color Legend Indicators */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: '#2563eb', borderRadius: '2px' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#56615b' }}>Demand</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: '#10b981', borderRadius: '2px' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#56615b' }}>Available Stock</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: '#ef4444', borderRadius: '2px' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#56615b' }}>Deficiency</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={administrationMetrics} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="administration" stroke="#64748b" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val.toLocaleString()} Units`, '']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '4px', fontSize: '12px' }}
                  />
                  <Bar dataKey="demand" name="Demand" fill="#2563eb" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="availableStock" name="Available Stock" fill="#10b981" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="deficiency" name="Deficiency" fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Right Stock Status Donut Chart */}
        <Grid item xs={12} lg={4.5}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e0e2db', bgcolor: '#ffffff', borderRadius: '6px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#191c1a', mb: 1 }}>
              Stock Status (Administration Level)
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1, minHeight: 240 }}>
              {/* Donut Chart with Centered Metric */}
              <Box sx={{ position: 'relative', width: 170, height: 170, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val.toLocaleString()} Units`, '']} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text inside Donut */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.1, color: '#191c1a' }}>
                    {stockStatus.totalAvailableStock.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.62rem', fontWeight: 600, display: 'block' }}>
                    Available Stock<br />(Units)
                  </Typography>
                </Box>
              </Box>

              {/* Right Legend List */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8, pl: 2 }}>
                {/* Healthy */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981', mt: 0.4 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#191c1a', fontSize: '0.8rem', lineHeight: 1.1 }}>
                      Healthy Stock
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                      {stockStatus.healthyStock.toLocaleString()} ({stockStatus.healthyStockPct}%)
                    </Typography>
                  </Box>
                </Box>

                {/* Low */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f59e0b', mt: 0.4 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#191c1a', fontSize: '0.8rem', lineHeight: 1.1 }}>
                      Low Stock
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                      {stockStatus.lowStock.toLocaleString()} ({stockStatus.lowStockPct}%)
                    </Typography>
                  </Box>
                </Box>

                {/* Out of Stock */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444', mt: 0.4 }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#191c1a', fontSize: '0.8rem', lineHeight: 1.1 }}>
                      Out of Stock
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                      {stockStatus.outOfStock.toLocaleString()} ({stockStatus.outOfStockPct}%)
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ─────────────────────────────────────────────────────────────
          3. THIRD ROW (Top 5 Deficiency + 6-Mo Trend + Drill Down)
      ────────────────────────────────────────────────────────────── */}
      <Grid container spacing={2}>
        {/* Col 1: Top 5 Stations by Deficiency */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e0e2db', bgcolor: '#ffffff', borderRadius: '6px', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#191c1a' }}>
                Top 5 Stations by Deficiency
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, px: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>Station</Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>Deficiency (Units)</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.6 }}>
              {topDeficientStations.map((st: any, idx: number) => {
                const maxDef = 350;
                const barPct = Math.min(100, Math.round((st.deficiency / maxDef) * 100));

                return (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#191c1a', width: 110, flexShrink: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {st.name || st.stationName}
                    </Typography>
                    <Box sx={{ flex: 1, bgcolor: '#fee2e2', height: 16, borderRadius: '2px', overflow: 'hidden' }}>
                      <Box sx={{ width: `${barPct}%`, bgcolor: '#f87171', height: '100%', borderRadius: '2px' }} />
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#991b1b', width: 35, textAlign: 'right' }}>
                      {st.deficiency}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Col 2: Demand vs Stock Trend (Last 6 Months) */}
        <Grid item xs={12} md={4.5}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e0e2db', bgcolor: '#ffffff', borderRadius: '6px', height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#191c1a' }}>
                Demand vs Stock Trend (Last 6 Months)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563eb' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>Demand</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>Stock</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ height: 180, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val: any) => [`${val.toLocaleString()} Units`, '']} />
                  <Area type="monotone" dataKey="demand" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorDemand)" />
                  <Area type="monotone" dataKey="stock" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorStock)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Col 3: Drill Down Interactive Wizard */}
        <Grid item xs={12} md={3.5}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e0e2db', bgcolor: '#ffffff', borderRadius: '6px', height: '100%' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#191c1a', mb: 1.5 }}>
              Drill Down
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              {/* Step 1 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  1
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#191c1a' }}>
                  Select Administration
                </Typography>
              </Box>
              <FormControl fullWidth size="small">
                <Select
                  value={drillAdmin}
                  onChange={(e) => {
                    setDrillAdmin(e.target.value);
                    setDrillStation('ALL');
                  }}
                  sx={{ borderRadius: '4px', fontSize: '0.78rem', bgcolor: '#f8fafc', height: 32 }}
                >
                  {filterOptions.administrations.map((adm: string) => (
                    <MenuItem key={adm} value={adm} sx={{ fontSize: '0.78rem' }}>
                      {adm}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Arrow */}
              <Box sx={{ display: 'flex', justifyContent: 'center', my: -0.4 }}>
                <ArrowDownwardIcon sx={{ fontSize: '1rem', color: '#94a3b8' }} />
              </Box>

              {/* Step 2 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  2
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#191c1a' }}>
                  View Stations
                </Typography>
              </Box>
              <FormControl fullWidth size="small">
                <Select
                  value={drillStation}
                  onChange={(e) => setDrillStation(e.target.value)}
                  sx={{ borderRadius: '4px', fontSize: '0.78rem', bgcolor: '#f8fafc', height: 32 }}
                >
                  <MenuItem value="ALL" sx={{ fontSize: '0.78rem' }}>
                    All Stations ({drillAdmin})
                  </MenuItem>
                  {filterOptions.stations
                    .filter((s: any) => drillAdmin === 'ALL' || s.administration === drillAdmin)
                    .map((st: any) => (
                      <MenuItem key={st.id} value={st.id} sx={{ fontSize: '0.78rem' }}>
                        {st.name} ({st.code})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {/* Arrow */}
              <Box sx={{ display: 'flex', justifyContent: 'center', my: -0.4 }}>
                <ArrowDownwardIcon sx={{ fontSize: '1rem', color: '#94a3b8' }} />
              </Box>

              {/* Step 3 */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  3
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#191c1a' }}>
                  See Detailed Data
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem', pl: 3.5, display: 'block' }}>
                Charts, KPIs and table update automatically
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* ─────────────────────────────────────────────────────────────
          4. BOTTOM SECTION: STATION LEVEL DETAILS TABLE & ACTIONS
      ────────────────────────────────────────────────────────────── */}
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #e0e2db', bgcolor: '#ffffff', borderRadius: '6px' }}>
        {/* Table Header Bar */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#191c1a' }}>
            Station Level Details (Filtered: {adminFilter === 'ALL' ? 'All Administrations' : `${adminFilter} Administration`})
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Table / Chart Toggle */}
            <ToggleButtonGroup
              value={bottomView}
              exclusive
              onChange={(_, val) => {
                if (val) setBottomView(val);
              }}
              size="small"
              sx={{
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                '& .MuiToggleButton-root': {
                  px: 1.8,
                  py: 0.4,
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  border: 'none',
                  color: '#64748b',
                  '&.Mui-selected': {
                    bgcolor: '#2563eb',
                    color: '#ffffff',
                    '&:hover': { bgcolor: '#1d4ed8' },
                  },
                },
              }}
            >
              <ToggleButton value="TABLE">
                <TableChartIcon sx={{ fontSize: '1rem', mr: 0.6 }} /> Table View
              </ToggleButton>
              <ToggleButton value="CHART">
                <BarChartIcon sx={{ fontSize: '1rem', mr: 0.6 }} /> Chart View
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Export Button */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={handleExportDetails}
              sx={{
                color: '#191c1a',
                borderColor: '#cbd5e1',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.75rem',
                '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
              }}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Conditional View Rendering */}
        {bottomView === 'TABLE' ? (
          <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: '4px' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#1e5631' }}>
                <TableRow>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.78rem' }}>Station</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.78rem' }}>Item Category</TableCell>
                  <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.78rem' }}>Demand (Units)</TableCell>
                  <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.78rem' }}>Available Stock (Units)</TableCell>
                  <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.78rem' }}>Deficiency (Units)</TableCell>
                  <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.78rem' }}>Stock Status</TableCell>
                  <TableCell sx={{ color: '#ffffff', fontWeight: 800, fontSize: '0.78rem', minWidth: 160 }}>Fulfillment Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stationLevelDetails.length > 0 ? (
                  stationLevelDetails.map((row: any) => {
                    const isHealthy = row.stockStatus === 'Healthy Stock';
                    const isOut = row.stockStatus === 'Out of Stock';

                    return (
                      <TableRow key={row.id} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#f8fafc' } }}>
                        <TableCell sx={{ fontWeight: 700, color: '#191c1a', fontSize: '0.8rem' }}>
                          {row.station}
                        </TableCell>
                        <TableCell sx={{ color: '#475569', fontSize: '0.8rem', fontWeight: 500 }}>
                          {row.category}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#191c1a', fontSize: '0.8rem' }}>
                          {row.demand.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#047857', fontSize: '0.8rem' }}>
                          {row.availableStock.toLocaleString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#b91c1c', fontSize: '0.8rem' }}>
                          {row.deficiency.toLocaleString()}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={row.stockStatus}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              bgcolor: isHealthy ? '#ecfdf5' : isOut ? '#fef2f2' : '#fffbeb',
                              color: isHealthy ? '#047857' : isOut ? '#b91c1c' : '#b45309',
                              border: `1px solid ${isHealthy ? '#a7f3d0' : isOut ? '#fecaca' : '#fde68a'}`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#191c1a', width: 42 }}>
                              {row.fulfillmentRate}%
                            </Typography>
                            <Box sx={{ flex: 1, bgcolor: '#fee2e2', height: 7, borderRadius: '3px', overflow: 'hidden' }}>
                              <Box
                                sx={{
                                  width: `${Math.min(100, row.fulfillmentRate)}%`,
                                  bgcolor: isHealthy ? '#10b981' : isOut ? '#ef4444' : '#f87171',
                                  height: '100%',
                                  borderRadius: '3px',
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3, color: '#64748b' }}>
                      No stations match the selected filter criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ height: 320, width: '100%', pt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stationLevelDetails} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stationCode" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val.toLocaleString()} Units`, '']} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="demand" name="Demanded Units" fill="#2563eb" radius={[2, 2, 0, 0]} />
                <Bar dataKey="availableStock" name="Available Units" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="deficiency" name="Deficiency Units" fill="#ef4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

export default function ExecutiveDashboardPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', height: '65vh', alignItems: 'center', justifyContent: 'center', gap: 2, flexDirection: 'column' }}>
          <CircularProgress sx={{ color: '#1e5631' }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e5631' }}>
            Loading ASF Executive Inventory Command Center...
          </Typography>
        </Box>
      }
    >
      <ExecutiveDashboardContent />
    </Suspense>
  );
}
