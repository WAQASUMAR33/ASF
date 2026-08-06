'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Paper,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LayersIcon from '@mui/icons-material/Layers';
import CategoryIcon from '@mui/icons-material/Category';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LockIcon from '@mui/icons-material/Lock';

interface SidebarProps {
  userRole?: string;
}

export default function Sidebar({ userRole = 'STORE_CLERK' }: SidebarProps) {
  const pathname = usePathname();
  const isHQ = ['DD_PROCUREMENT', 'CENTRAL_STORE', 'SYSTEM_ADMIN'].includes(userRole);

  const navItems = [
    {
      label: 'Executive Dashboard',
      href: '/',
      icon: DashboardIcon,
      roles: ['STORE_CLERK', 'STORE_OFFICER', 'CSO', 'DD_PROCUREMENT', 'CENTRAL_STORE', 'SYSTEM_ADMIN'],
    },
    {
      label: 'Station Demands',
      href: '/demands',
      icon: AssignmentIcon,
      badge: 'Workflow',
      roles: ['STORE_CLERK', 'STORE_OFFICER', 'CSO', 'DD_PROCUREMENT', 'CENTRAL_STORE', 'SYSTEM_ADMIN'],
    },
    {
      label: 'HQ Rollup & Deficiency',
      href: '/hq-consolidation',
      icon: LayersIcon,
      badge: 'HQ Engine',
      roles: ['DD_PROCUREMENT', 'CENTRAL_STORE', 'SYSTEM_ADMIN'],
    },
    {
      label: 'Kit Item Catalog (MDM)',
      href: '/catalog',
      icon: CategoryIcon,
      roles: ['STORE_CLERK', 'STORE_OFFICER', 'CSO', 'DD_PROCUREMENT', 'CENTRAL_STORE', 'SYSTEM_ADMIN'],
    },
    {
      label: 'HQ Distributions',
      href: '/distributions',
      icon: LocalShippingIcon,
      roles: ['STORE_CLERK', 'STORE_OFFICER', 'CSO', 'DD_PROCUREMENT', 'CENTRAL_STORE', 'SYSTEM_ADMIN'],
    },
    {
      label: 'Station Manpower Matrix',
      href: '/manpower',
      icon: LocationCityIcon,
      roles: ['STORE_OFFICER', 'CSO', 'DD_PROCUREMENT', 'CENTRAL_STORE', 'SYSTEM_ADMIN'],
    },
    {
      label: 'User & Role Security',
      href: '/users',
      icon: AdminPanelSettingsIcon,
      badge: 'Admin',
      roles: ['SYSTEM_ADMIN'],
    },
  ];

  return (
    <Box
      component="aside"
      sx={{
        width: 260,
        bgcolor: '#ffffff',
        borderRight: '1px solid #e0e2db',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        flexShrink: 0,
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <Box>
        <Typography
          variant="caption"
          sx={{ color: '#56615b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, px: 1.5, mb: 1, display: 'block' }}
        >
          Main Navigation
        </Typography>

        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {navItems
            .filter((item) => item.roles.includes(userRole))
            .map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <ListItem key={item.href} disablePadding>
                  <ListItemButton
                    component={Link}
                    href={item.href}
                    selected={isActive}
                    sx={{
                      borderRadius: 0,
                      py: 1,
                      px: 1.5,
                      '&.Mui-selected': {
                        bgcolor: 'rgba(30, 86, 49, 0.08)',
                        border: '1px solid #1e5631',
                        '&:hover': {
                          bgcolor: 'rgba(30, 86, 49, 0.12)',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: isActive ? '#1e5631' : '#56615b' }}>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.8rem',
                        fontWeight: isActive ? 800 : 600,
                        color: isActive ? '#1e5631' : '#191c1a',
                      }}
                    />
                    {item.badge && (
                      <Chip
                        label={item.badge}
                        size="small"
                        color={isActive ? 'primary' : 'default'}
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
        </List>
      </Box>

      {/* Footer Info Box */}
      <Paper elevation={0} sx={{ p: 2, bgcolor: '#faf8f5', border: '1px solid #e0e2db', borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <LockIcon fontSize="small" sx={{ color: '#1e5631' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#191c1a' }}>
            Station Isolation
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#56615b', display: 'block', lineHeight: 1.4 }}>
          {isHQ ? 'HQ Visibility across all 30+ ASF Stations' : 'Station Scoped Visibility Active'}
        </Typography>
      </Paper>
    </Box>
  );
}
