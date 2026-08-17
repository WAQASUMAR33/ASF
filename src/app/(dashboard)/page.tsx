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

const COLORS = ['#1e5631', '#2d6a4f', '#386641', '#56615b', '#d97706', '#1b4d2e'];

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartItemFilter, setChartItemFilter] = useState('ALL');
  const [chartDeficiencyFilter, setChartDeficiencyFilter] = useState('ALL');

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

  if (loading || !data || !data.metrics) {
    return (
      <Box sx={{ display: 'flex', height: 400, alignItems: 'center', justifyContent: 'center', gap: 2, flexDirection: 'column' }}>
        {data?.error ? (
          <Paper variant="outlined" sx={{ p: 3, borderColor: '#ef9a9a', bgcolor: '#ffebee', textAlign: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#c62828' }}>
              Analytics Loading Error: {data.error}
            </Typography>
            <Button variant="outlined" size="small" onClick={fetchAnalytics} sx={{ mt: 1.5, color: '#c62828', borderColor: '#ef9a9a' }}>
              Retry Loading Analytics
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress sx={{ color: '#1e5631' }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              Loading ASF Portal Analytics Engine...
            </Typography>
          </Box>
        )}
      </Box>
    );
  }

  const metrics = data.metrics || {
    activeDemandsCount: 0,
    issuedDistributionsCount: 0,
    totalStations: 0,
    isStationScoped: false,
    stationCode: '',
    stationName: '',
    stationHeadcount: 0,
    stationMale: 0,
    stationFemale: 0,
    totalHeadcount: 0,
    maleHeadcount: 0,
    femaleHeadcount: 0,
  };
  const stationShortfallChart = data.stationShortfallChart || [];

  // Filter graph data dynamically
  const filteredChartData = (stationShortfallChart || []).filter((item: any) => {
    const matchesDeficiency =
      chartDeficiencyFilter === 'ALL' ||
      (chartDeficiencyFilter === 'DEFICIENT' && item.demanded > item.fulfilled) ||
      (chartDeficiencyFilter === 'SUFFICIENT' && item.demanded <= item.fulfilled);

    return matchesDeficiency;
  });

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
                  {metrics.isStationScoped ? `Station Headcount (${metrics.stationCode})` : 'Total Headcount'}
                </Typography>
                <PeopleIcon sx={{ color: '#f39c12' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 900, my: 1, color: '#d35400' }}>
                {metrics.isStationScoped ? (metrics.stationHeadcount || 0).toLocaleString() : metrics.totalHeadcount.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: '#56615b' }}>
                {metrics.isStationScoped
                  ? `M: ${(metrics.stationMale || 0).toLocaleString()} • F: ${(metrics.stationFemale || 0).toLocaleString()} (${metrics.stationName || 'Station'})`
                  : `M: ${metrics.maleHeadcount.toLocaleString()} • F: ${metrics.femaleHeadcount.toLocaleString()}`}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Charts & Breakdown Row */}
      <Grid container spacing={3}>
        {/* Left Bar Chart */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={1} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justify: 'space-between', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingDownIcon sx={{ color: '#1e5631' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e5631' }}>
                    Station Demands vs Central Fulfillment
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#56615b' }}>
                    Comparative breakdown by ASF Stations & Stock Fulfillment
                  </Typography>
                </Box>
              </Box>

              {/* Itemwise & Deficiency Filters */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <select
                  value={chartDeficiencyFilter}
                  onChange={(e) => setChartDeficiencyFilter(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    borderRadius: '0px',
                    borderColor: '#e0e2db',
                    fontWeight: 600,
                    color: '#191c1a',
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DEFICIENT">Deficient Only</option>
                  <option value="SUFFICIENT">Sufficient Only</option>
                </select>
              </Box>
            </Box>

            <Box sx={{ height: 320, width: '100%', pt: 1 }}>
              {filteredChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e2db" />
                    <XAxis dataKey="stationCode" stroke="#56615b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#56615b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e0e2db', borderRadius: '0px', fontSize: '12px' }}
                      itemStyle={{ color: '#191c1a' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="demanded" name="Demanded Quantity" fill="#1e5631" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="fulfilled" name="Central Fulfillment Stock" fill="#2d6a4f" radius={[0, 0, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#56615b' }}>
                    No station demand metrics match the selected filter.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Station-wise / Item-wise Demand Breakdown */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={1} sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationCityIcon sx={{ color: '#1e5631' }} />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e5631' }}>
                  Station-wise / Item-wise Demand Breakdown
                </Typography>
                <Typography variant="caption" sx={{ color: '#56615b' }}>
                  Station demand totals vs fulfillment deficiency
                </Typography>
              </Box>
            </Box>

            <Box sx={{ height: 320, width: '100%', overflowY: 'auto', pr: 0.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {stationShortfallChart.length > 0 ? (
                stationShortfallChart.map((st: any, idx: number) => {
                  const deficiency = Math.max(0, st.demanded - st.fulfilled);
                  const fulfillPct = st.demanded > 0 ? Math.min(100, Math.round((st.fulfilled / st.demanded) * 100)) : 100;

                  return (
                    <Paper key={idx} variant="outlined" sx={{ p: 1.8, borderRadius: 0, border: '1px solid #e0e2db', bgcolor: '#faf8f5' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={st.stationCode} size="small" sx={{ fontWeight: 900, bgcolor: '#1e5631', color: '#ffffff', height: 20, fontSize: '0.68rem' }} />
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#191c1a' }}>
                            {st.stationName}
                          </Typography>
                        </Box>

                        <Chip
                          label={deficiency > 0 ? `Deficiency: ${deficiency}` : 'Fully Fulfilled'}
                          size="small"
                          color={deficiency > 0 ? 'error' : 'success'}
                          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#1e5631', fontWeight: 800 }}>
                          Demanded: {st.demanded} units
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#2d6a4f', fontWeight: 800 }}>
                          Issued: {st.fulfilled} units ({fulfillPct}%)
                        </Typography>
                      </Box>

                      {/* Progress Fill Bar */}
                      <Box sx={{ width: '100%', bgcolor: '#e0e2db', height: 6, position: 'relative' }}>
                        <Box sx={{ width: `${fulfillPct}%`, bgcolor: deficiency > 0 ? '#d97706' : '#2d6a4f', height: '100%' }} />
                      </Box>
                    </Paper>
                  );
                })
              ) : (
                <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#56615b' }}>
                    No station demand breakdown available.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
