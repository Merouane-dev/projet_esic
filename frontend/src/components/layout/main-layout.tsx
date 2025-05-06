// frontend/src/components/layout/MainLayout.tsx
import React, { useState, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Hidden,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Menu,
  MenuItem,
  Badge,
  Avatar,
  Container,
  Box,
  Tooltip
} from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Storage as StorageIcon,
  BarChart as BarChartIcon,
  Description as DescriptionIcon,
  Timeline as TimelineIcon,
  SupervisorAccount as SupervisorAccountIcon,
  Security as SecurityIcon,
  History as HistoryIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as ExitToAppIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon
} from '@material-ui/icons';
import { userService, User } from '../../services/user.service';
import { logout } from '../../utils/auth';

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  drawer: {
    [theme.breakpoints.up('sm')]: {
      width: drawerWidth,
      flexShrink: 0,
    },
  },
  menuButton: {
    marginRight: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
      display: 'none',
    },
  },
  toolbar: theme.mixins.toolbar,
  drawerPaper: {
    width: drawerWidth,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  title: {
    flexGrow: 1,
  },
  avatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    marginLeft: theme.spacing(1),
  },
  userInfo: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: theme.palette.background.default,
  },
  userName: {
    marginTop: theme.spacing(1),
    textAlign: 'center',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  active: {
    backgroundColor: theme.palette.action.selected,
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  nested: {
    paddingLeft: theme.spacing(4),
  },
  version: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing(1),
    textAlign: 'center',
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.paper,
    borderTop: `1px solid ${theme.palette.divider}`,
  },
}));

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const location = useLocation();
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notifMenuAnchor, setNotifMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Fetch current user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await userService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to load user data:', error);
        logout();
        history.push('/login');
      }
    };
    
    loadUser();
  }, [history]);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleNotifMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifMenuAnchor(event.currentTarget);
  };
  
  const handleNotifMenuClose = () => {
    setNotifMenuAnchor(null);
  };
  
  const handleLogout = () => {
    logout();
    history.push('/login');
  };
  
  const handleNavigation = (path: string) => {
    history.push(path);
    setMobileOpen(false);
  };
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  const drawer = (
    <div>
      {user && (
        <div className={classes.userInfo}>
          <Avatar className={classes.avatar}>
            {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </Avatar>
          <Typography className={classes.userName} variant="subtitle1">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.email.split('@')[0]}
          </Typography>
          <Typography className={classes.userEmail} variant="body2">
            {user.email}
          </Typography>
        </div>
      )}
      <Divider />
      <List>
        <ListItem
          button
          onClick={() => handleNavigation('/dashboard')}
          className={isActive('/dashboard') ? classes.active : ''}
        >
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        
        <ListItem
          button
          onClick={() => handleNavigation('/datasets')}
          className={isActive('/datasets') ? classes.active : ''}
        >
          <ListItemIcon>
            <StorageIcon />
          </ListItemIcon>
          <ListItemText primary="Datasets" />
        </ListItem>
        
        <ListItem
          button
          onClick={() => handleNavigation('/visualizations')}
          className={isActive('/visualizations') ? classes.active : ''}
        >
          <ListItemIcon>
            <BarChartIcon />
          </ListItemIcon>
          <ListItemText primary="Visualizations" />
        </ListItem>
        
        <ListItem
          button
          onClick={() => handleNavigation('/reports')}
          className={isActive('/reports') ? classes.active : ''}
        >
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>
          <ListItemText primary="Reports" />
        </ListItem>
        
        <ListItem
          button
          onClick={() => handleNavigation('/activity')}
          className={isActive('/activity') ? classes.active : ''}
        >
          <ListItemIcon>
            <HistoryIcon />
          </ListItemIcon>
          <ListItemText primary="My Activity" />
        </ListItem>
      </List>
      
      {user?.is_superuser && (
        <>
          <Divider />
          <List>
            <ListItem>
              <ListItemText
                primary="Administration"
                primaryTypographyProps={{ variant: 'overline' }}
              />
            </ListItem>
            
            <ListItem
              button
              onClick={() => handleNavigation('/admin/users')}
              className={isActive('/admin/users') ? classes.active : ''}
            >
              <ListItemIcon>
                <SupervisorAccountIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItem>
            
            <ListItem
              button
              onClick={() => handleNavigation('/admin/audit')}
              className={isActive('/admin/audit') ? classes.active : ''}
            >
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText primary="Audit Logs" />
            </ListItem>
          </List>
        </>
      )}
      
      <div className={classes.version}>
        <Typography variant="caption">
          Data Analysis Dashboard v1.0.0
        </Typography>
      </div>
    </div>
  );
  
  return (
    <div className={classes.root}>
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className={classes.menuButton}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap className={classes.title}>
            Data Analysis Dashboard
          </Typography>
          
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotifMenuOpen}>
              <Badge badgeContent={3} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="User Menu">
            <IconButton
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      <nav className={classes.drawer}>
        <Hidden smUp implementation="css">
          <Drawer
            variant="temporary"
            anchor={theme.direction === 'rtl' ? 'right' : 'left'}
            open={mobileOpen}
            onClose={handleDrawerToggle}
            classes={{
              paper: classes.drawerPaper,
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
          >
            {drawer}
          </Drawer>
        </Hidden>
        <Hidden xsDown implementation="css">
          <Drawer
            classes={{
              paper: classes.drawerPaper,
            }}
            variant="permanent"
            open
          >
            <div className={classes.toolbar} />
            {drawer}
          </Drawer>
        </Hidden>
      </nav>
      
      <main className={classes.content}>
        <div className={classes.toolbar} />
        <Container maxWidth="lg">
          {children}
        </Container>
      </main>
      
      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        keepMounted
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
      >
        <MenuItem onClick={() => {
          handleUserMenuClose();
          history.push('/profile');
        }}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        
        <MenuItem onClick={() => {
          handleUserMenuClose();
          history.push('/settings');
        }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notifMenuAnchor}
        keepMounted
        open={Boolean(notifMenuAnchor)}
        onClose={handleNotifMenuClose}
      >
        <MenuItem>
          <Box>
            <Typography variant="subtitle2">New Dataset Uploaded</Typography>
            <Typography variant="body2" color="textSecondary">
              User john@example.com uploaded a new dataset
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem>
          <Box>
            <Typography variant="subtitle2">Report Shared</Typography>
            <Typography variant="body2" color="textSecondary">
              User jane@example.com shared a report with you
            </Typography>
          </Box>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleNotifMenuClose}>
          <Typography variant="body2" color="primary">
            View All Notifications
          </Typography>
        </MenuItem>
      </Menu>
    </div>
  );
};
