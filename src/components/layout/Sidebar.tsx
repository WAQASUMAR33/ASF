'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
  Divider,
  Collapse,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CategoryIcon from '@mui/icons-material/Category';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Station to Administration Region Mapping
const STATION_ADMIN_MAP: Record<string, 'Central' | 'North' | 'South' | 'East' | 'West'> = {
  ISB: 'North', PEW: 'North', RWP: 'North', GIL: 'North', KDU: 'North', ISU: 'North', CHB: 'North', MFG: 'North', DSK: 'North',
  LHE: 'Central', SKT: 'Central', LYP: 'Central', MUX: 'Central', BHV: 'Central', RYK: 'Central', DBA: 'Central',
  KHI: 'South', HDD: 'South', SKZ: 'South', BDN: 'South', WNS: 'South', O99: 'South', JAG: 'South',
  UET: 'West', GWD: 'West', PBN: 'West', PJG: 'West', PAS: 'West', KDD: 'West', ZGZ: 'West',
};

function getStationAdmin(code: string): 'Central' | 'North' | 'South' | 'East' | 'West' {
  if (STATION_ADMIN_MAP[code]) return STATION_ADMIN_MAP[code];
  const charCode = code.charCodeAt(0) || 0;
  if (charCode % 5 === 0) return 'East';
  if (charCode % 4 === 0) return 'West';
  if (charCode % 3 === 0) return 'South';
  if (charCode % 2 === 0) return 'Central';
  return 'North';
}

interface SidebarProps {
  userRole?: string;
}

export default function Sidebar({ userRole = 'STORE_CLERK' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters State
  const [selectedAdmin, setSelectedAdmin] = useState<string>(searchParams.get('administration') || 'ALL');
  const [selectedStation, setSelectedStation] = useState<string>(searchParams.get('stationId') || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('categoryId') || 'ALL');

  // Loaded Options
  const [stations, setStations] = useState<Array<{ id: string; code: string; name: string; administration: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [showMoreModules, setShowMoreModules] = useState(false);

  useEffect(() => {
    // Load station and category lists for dropdowns
    async function loadOptions() {
      try {
        const [stRes, catRes] = await Promise.all([
          fetch('/api/stations'),
          fetch('/api/categories'),
        ]);
        const stData = await stRes.json();
        const catData = await catRes.json();

        if (stData.stations) {
          setStations(
            stData.stations.map((s: any) => ({
              id: s.id,
              code: s.code,
              name: s.name,
              administration: getStationAdmin(s.code),
            }))
          );
        }
        if (catData.categories) {
          setCategories(catData.categories);
        }
      } catch (err) {
        console.error('Failed to load filter options in sidebar:', err);
      }
    }
    loadOptions();
  }, []);

  // Sync state if searchParams change externally
  useEffect(() => {
    setSelectedAdmin(searchParams.get('administration') || 'ALL');
    setSelectedStation(searchParams.get('stationId') || 'ALL');
    setSelectedCategory(searchParams.get('categoryId') || 'ALL');
  }, [searchParams]);

  const handleApply = () => {
    const params = new URLSearchParams();
    if (selectedAdmin !== 'ALL') params.set('administration', selectedAdmin);
    if (selectedStation !== 'ALL') params.set('stationId', selectedStation);
    if (selectedCategory !== 'ALL') params.set('categoryId', selectedCategory);

    const queryString = params.toString();
    const targetUrl = queryString ? `/?${queryString}` : '/';
    router.push(targetUrl);
  };

  const navLinks = [
    { label: 'Overview', href: '/', icon: HomeIcon, isActive: pathname === '/' },
    { label: 'Administration', href: '/hq-consolidation', icon: AccountBalanceIcon, isActive: pathname === '/hq-consolidation' },
    { label: 'Stations', href: '/demands', icon: LocationOnIcon, isActive: pathname === '/demands' },
    { label: 'Reports', href: '/distributions', icon: DescriptionIcon, isActive: pathname === '/distributions' },
  ];

  const secondaryLinks = [
    { label: 'Kit Item Catalog', href: '/catalog', icon: CategoryIcon, isActive: pathname === '/catalog' },
    { label: 'Station Manpower', href: '/manpower', icon: LocationCityIcon, isActive: pathname === '/manpower' },
    { label: 'User Security', href: '/users', icon: AdminPanelSettingsIcon, isActive: pathname === '/users' },
  ];

  return (
    <Box
      component="aside"
      sx={{
        width: 240,
        bgcolor: '#0e2a18', // Deep Forest Green Authority Shade
        color: '#ffffff',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flexShrink: 0,
        minHeight: 'calc(100vh - 64px)',
        borderRight: '1px solid #091f11',
      }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION ITEMS (Matching Mockup)
      ────────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
        {navLinks.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Box
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 1.8,
                py: 1.1,
                borderRadius: '6px',
                textDecoration: 'none',
                bgcolor: active ? '#2563eb' : 'transparent', // Royal blue active button matching mockup
                color: '#ffffff',
                fontWeight: active ? 800 : 600,
                fontSize: '0.88rem',
                transition: 'all 0.15s ease',
                '&:hover': {
                  bgcolor: active ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                },
              }}
            >
              <Icon sx={{ fontSize: '1.25rem', color: '#ffffff' }} />
              <Typography variant="body2" sx={{ fontWeight: 'inherit', fontSize: 'inherit', color: '#ffffff' }}>
                {item.label}
              </Typography>
            </Box>
          );
        })}

        {/* Expandable Secondary System Modules */}
        <Box
          onClick={() => setShowMoreModules(!showMoreModules)}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1.8,
            py: 0.6,
            cursor: 'pointer',
            borderRadius: '4px',
            color: '#a7f3d0',
            fontSize: '0.75rem',
            fontWeight: 700,
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.05)' },
          }}
        >
          <span>More Modules</span>
          {showMoreModules ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </Box>

        <Collapse in={showMoreModules}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pl: 1, pt: 0.5 }}>
            {secondaryLinks.map((item) => {
              const Icon = item.icon;
              const active = item.isActive;

              return (
                <Box
                  key={item.href}
                  component={Link}
                  href={item.href}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    px: 1.5,
                    py: 0.8,
                    borderRadius: '4px',
                    textDecoration: 'none',
                    bgcolor: active ? 'rgba(37, 99, 235, 0.6)' : 'transparent',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: active ? 800 : 500,
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.08)' },
                  }}
                >
                  <Icon sx={{ fontSize: '1rem', color: '#a7f3d0' }} />
                  <Typography variant="caption" sx={{ fontWeight: 'inherit', fontSize: 'inherit', color: '#ffffff' }}>
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Collapse>
      </Box>

      {/* Divider */}
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', my: 0.5 }} />

      {/* ─────────────────────────────────────────────────────────────
          2. FILTERS SECTION (Matching Mockup)
      ────────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterAltIcon sx={{ fontSize: '1.2rem', color: '#10b981' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#ffffff', fontSize: '0.95rem' }}>
            Filters
          </Typography>
        </Box>

        {/* Administration Filter */}
        <Box>
          <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800, mb: 0.6, display: 'block', fontSize: '0.75rem' }}>
            Administration
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={selectedAdmin}
              onChange={(e) => {
                setSelectedAdmin(e.target.value);
                setSelectedStation('ALL');
              }}
              sx={{
                bgcolor: '#ffffff',
                color: '#191c1a',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
                height: 36,
                '& .MuiSelect-select': { py: 0.8, px: 1.2 },
                '& .MuiSvgIcon-root': { color: '#475569' },
              }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>All Administrations</MenuItem>
              <MenuItem value="Central" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>Central</MenuItem>
              <MenuItem value="North" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>North</MenuItem>
              <MenuItem value="South" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>South</MenuItem>
              <MenuItem value="East" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>East</MenuItem>
              <MenuItem value="West" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>West</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Station Filter */}
        <Box>
          <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800, mb: 0.6, display: 'block', fontSize: '0.75rem' }}>
            Station
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              sx={{
                bgcolor: '#ffffff',
                color: '#191c1a',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
                height: 36,
                '& .MuiSelect-select': { py: 0.8, px: 1.2 },
                '& .MuiSvgIcon-root': { color: '#475569' },
              }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>All Stations</MenuItem>
              {stations
                .filter((s) => selectedAdmin === 'ALL' || s.administration === selectedAdmin)
                .map((st) => (
                  <MenuItem key={st.id} value={st.id} sx={{ fontSize: '0.8rem' }}>
                    {st.name} ({st.code})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>

        {/* Item Category Filter */}
        <Box>
          <Typography variant="caption" sx={{ color: '#ffffff', fontWeight: 800, mb: 0.6, display: 'block', fontSize: '0.75rem' }}>
            Item Category
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{
                bgcolor: '#ffffff',
                color: '#191c1a',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 700,
                height: 36,
                '& .MuiSelect-select': { py: 0.8, px: 1.2 },
                '& .MuiSvgIcon-root': { color: '#475569' },
              }}
            >
              <MenuItem value="ALL" sx={{ fontSize: '0.8rem', fontWeight: 600 }}>All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id} sx={{ fontSize: '0.8rem' }}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Apply Action Button */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<FilterAltIcon sx={{ fontSize: '1.1rem' }} />}
          onClick={handleApply}
          sx={{
            mt: 0.5,
            bgcolor: '#2563eb', // Royal Blue button matching mockup
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.88rem',
            textTransform: 'none',
            py: 1,
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          Apply
        </Button>
      </Box>
    </Box>
  );
}
