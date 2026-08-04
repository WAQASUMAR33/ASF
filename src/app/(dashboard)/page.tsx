'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PeopleIcon from '@mui/icons-material/People';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PieChartIcon from '@mui/icons-material/PieChart';
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
} from 'recharts';
import { downloadCSV } from '@/lib/export';

const COLORS = ['#1e5631', '#2d6a4f', '#2980b9', '#e74c3c', '#f39c12', '#8e44ad'];

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
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
  }, []);

  const handleExportSummary = () => {
    if (!data?.stationShortfallChart) return;
    downloadCSV('ASF_Station_Shortfall_Summary.csv', data.stationShortfallChart);
  };

  if (loading || !data) {
    return (
      <Box sx={{ display: 'flex', height: 400, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress sx={{ color: '#1e5631' }} />
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Loading ASF Portal Analytics Engine...
        </Typography>
      </Box>
    );
  }

  const { metrics, stationShortfallChart, sizeBreakdown } = data;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justify: 'space-between', gap: 2, borderBottom: '1px solid #e0e2db', pb: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#1e5631' }}>
              Executive Dashboard
            </Typography>
            <Chip label="HQ Real-Time" color="primary" size="small" sx={{ fontWeight: 700 }} />
          </Box>
          <Typography variant="caption" sx={{ color: '#56615b' }}>
            Airports Security Force Logistics Metrics, Entitlement Ceiling Tracking & Station Shortfalls
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" size="small" onClick={fetchAnalytics} startIcon={<RefreshIcon />} sx={{ color: '#1e5631', borderColor: '#1e5631' }}>
            Refresh
          </Button>
          <Button variant="contained" size="small" onClick={handleExportSummary} startIcon={<FileDownloadIcon />} sx={{ bgcolor: '#1e5631', '&:hover': { bgcolor: '#1b4d2e' } }}>
            Export Shortfall CSV
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderLeft: '4px solid #1e5631' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 800, textTransform: 'uppercase' }}>
                  Active Demands
                </Typography>
                <AssignmentIcon sx={{ color: '#1e5631' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, my: 1, color: '#1e5631' }}>
                {metrics.activeDemandsCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#56615b' }}>
                Under station/officer review pipeline
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderLeft: '4px solid #2d6a4f' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 800, textTransform: 'uppercase' }}>
                  Dispatched Shipments
                </Typography>
                <LocalShippingIcon sx={{ color: '#2d6a4f' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, my: 1, color: '#2d6a4f' }}>
                {metrics.issuedDistributionsCount}
              </Typography>
              <Typography variant="caption" sx={{ color: '#56615b' }}>
                Central warehouse dispatches completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderLeft: '4px solid #2980b9' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 800, textTransform: 'uppercase' }}>
                  ASF Stations
                </Typography>
                <LocationCityIcon sx={{ color: '#2980b9' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, my: 1, color: '#2980b9' }}>
                {metrics.totalStations}
              </Typography>
              <Typography variant="caption" sx={{ color: '#56615b' }}>
                30+ Airports & Air Bases
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1} sx={{ borderLeft: '4px solid #f39c12' }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#56615b', fontWeight: 800, textTransform: 'uppercase' }}>
                  Total Headcount
                </Typography>
                <PeopleIcon sx={{ color: '#f39c12' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, my: 1, color: '#d35400' }}>
                {metrics.totalHeadcount.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#56615b' }}>
                M: {metrics.maleHeadcount.toLocaleString()} • F: {metrics.femaleHeadcount.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={1} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingDownIcon sx={{ color: '#1e5631' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e5631' }}>
                  Station Demands vs Central Fulfillment
                </Typography>
                <Typography variant="caption" sx={{ color: '#56615b' }}>
                  Comparative breakdown by top ASF Stations
                </Typography>
              </Box>
            </Box>

            <Box sx={{ height: 320, width: '100%', pt: 2 }}>
              {stationShortfallChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stationShortfallChart} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e2db" />
                    <XAxis dataKey="stationCode" stroke="#56615b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#56615b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e0e2db', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#191c1a' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="demanded" name="Demanded Quantity" fill="#1e5631" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fulfilled" name="Issued Stock" fill="#2d6a4f" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#56615b' }}>
                    No station demand metrics recorded yet.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper elevation={1} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PieChartIcon sx={{ color: '#1e5631' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e5631' }}>
                  Size Allocation Breakdown
                </Typography>
                <Typography variant="caption" sx={{ color: '#56615b' }}>
                  Demanded size allocations across stations
                </Typography>
              </Box>
            </Box>

            <Box sx={{ height: 320, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {sizeBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sizeBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="quantity"
                      nameKey="sizeLabel"
                      label={({ sizeLabel, percent }) => `${sizeLabel} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {sizeBreakdown.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e0e2db', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="caption" sx={{ color: '#56615b' }}>
                  No size metrics available
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
