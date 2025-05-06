// frontend/src/components/admin/AuditLogs.tsx
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Button,
  IconButton,
  Box,
  CircularProgress,
  Chip
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { Refresh, FilterList, Search, Clear } from '@material-ui/icons';
import { auditService, AuditLog } from '../../services/audit.service';
import { userService } from '../../services/user.service';
import { User } from '../../services/user.service';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
  },
  filtersContainer: {
    marginBottom: theme.spacing(2),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  table: {
    minWidth: 650,
  },
  actionCell: {
    fontWeight: 'bold',
  },
  userChip: {
    margin: theme.spacing(0.5),
  },
  loadingOverlay: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  },
  tableContainer: {
    position: 'relative',
    minHeight: 400,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  noWrap: {
    whiteSpace: 'nowrap',
  },
  filterButton: {
    marginTop: theme.spacing(2),
  },
}));

interface AuditLogFilters {
  userId?: number;
  entityType?: string;
  entityId?: number;
  action?: string;
}

export const AuditLogs: React.FC = () => {
  const classes = useStyles();
  
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  
  // Load audit logs
  const loadAuditLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const logs = await auditService.getAuditLogs(
        page * rowsPerPage,
        rowsPerPage,
        filters.userId,
        filters.entityType,
        filters.entityId,
        filters.action
      );
      
      setLogs(logs);
      
      // Extract unique entity types and actions for filters
      const types = [...new Set(logs.map(log => log.entity_type))];
      const actions = [...new Set(logs.map(log => log.action))];
      
      setEntityTypes(types);
      setActions(actions);
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Load users for filter dropdown
  const loadUsers = async () => {
    try {
      const users = await userService.getAllUsers();
      setUsers(users);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load users');
      }
    }
  };
  
  useEffect(() => {
    loadAuditLogs();
    loadUsers();
  }, [page, rowsPerPage]);
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleFilterChange = (key: keyof AuditLogFilters, value: any) => {
    setFilters({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };
  
  const applyFilters = () => {
    setPage(0);
    loadAuditLogs();
  };
  
  const clearFilters = () => {
    setFilters({});
    setPage(0);
    loadAuditLogs();
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get user name from ID
  const getUserName = (userId: number) => {
    const user = users.find(user => user.id === userId);
    return user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : `User #${userId}`;
  };
  
  // Get action color based on type
  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return '#4caf50';
      case 'UPDATE':
        return '#2196f3';
      case 'DELETE':
        return '#f44336';
      default:
        return '#9e9e9e';
    }
  };
  
  return (
    <Paper className={classes.paper}>
      <div className={classes.header}>
        <Typography component="h1" variant="h5">
          Audit Logs
        </Typography>
        
        <div>
          <IconButton onClick={() => setShowFilters(!showFilters)} color="primary">
            <FilterList />
          </IconButton>
          <IconButton onClick={loadAuditLogs} color="primary">
            <Refresh />
          </IconButton>
        </div>
      </div>
      
      {error && (
        <Alert severity="error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}
      
      {showFilters && (
        <Paper className={classes.filtersContainer}>
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="user-filter-label">User</InputLabel>
                  <Select
                    labelId="user-filter-label"
                    value={filters.userId || ''}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    label="User"
                  >
                    <MenuItem value="">
                      <em>All Users</em>
                    </MenuItem>
                    {users.map((user) => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="entity-type-filter-label">Entity Type</InputLabel>
                  <Select
                    labelId="entity-type-filter-label"
                    value={filters.entityType || ''}
                    onChange={(e) => handleFilterChange('entityType', e.target.value)}
                    label="Entity Type"
                  >
                    <MenuItem value="">
                      <em>All Types</em>
                    </MenuItem>
                    {entityTypes.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl variant="outlined" fullWidth>
                  <InputLabel id="action-filter-label">Action</InputLabel>
                  <Select
                    labelId="action-filter-label"
                    value={filters.action || ''}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    label="Action"
                  >
                    <MenuItem value="">
                      <em>All Actions</em>
                    </MenuItem>
                    {actions.map((action) => (
                      <MenuItem key={action} value={action}>
                        {action}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  variant="outlined"
                  fullWidth
                  label="Entity ID"
                  type="number"
                  value={filters.entityId || ''}
                  onChange={(e) => handleFilterChange('entityId', e.target.value ? parseInt(e.target.value) : '')}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Search />}
                  onClick={applyFilters}
                  className={classes.filterButton}
                >
                  Apply Filters
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearFilters}
                  style={{ marginLeft: '8px' }}
                  className={classes.filterButton}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}
      
      <div className={classes.tableContainer}>
        {loading && (
          <div className={classes.loadingOverlay}>
            <CircularProgress />
          </div>
        )}
        
        <TableContainer>
          <Table className={classes.table} aria-label="audit logs table">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Entity Type</TableCell>
                <TableCell>Entity ID</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>IP Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className={classes.noWrap}>{formatTimestamp(log.timestamp)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getUserName(log.user_id)}
                      size="small"
                      className={classes.userChip}
                      onClick={() => handleFilterChange('userId', log.user_id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      size="small"
                      style={{ backgroundColor: getActionColor(log.action), color: '#fff' }}
                      className={classes.chip}
                      onClick={() => handleFilterChange('action', log.action)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.entity_type}
                      size="small"
                      variant="outlined"
                      className={classes.chip}
                      onClick={() => handleFilterChange('entityType', log.entity_type)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.entity_id}
                      size="small"
                      variant="outlined"
                      className={classes.chip}
                      onClick={() => handleFilterChange('entityId', log.entity_id)}
                    />
                  </TableCell>
                  <TableCell>
                    {log.details ? (
                      <code>{JSON.stringify(JSON.parse(log.details), null, 2)}</code>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{log.ip_address || '-'}</TableCell>
                </TableRow>
              ))}
              
              {logs.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={-1}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={({ from, to }) => `${from}-${to}`}
        />
      </div>
    </Paper>
  );
};
