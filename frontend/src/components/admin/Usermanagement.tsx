// frontend/src/components/admin/UserManagement.tsx
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
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Chip,
  Box,
  Grid
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Block as BlockIcon,
  Check as CheckIcon
} from '@material-ui/icons';
import { userService, User, UserCreateRequest, UserEditRequest } from '../../services/user.service';

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
  tableContainer: {
    position: 'relative',
    minHeight: 400,
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  actionButton: {
    marginRight: theme.spacing(1),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  adminChip: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
  userChip: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  statusChip: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.success.contrastText,
  },
  inactiveChip: {
    backgroundColor: theme.palette.grey[500],
    color: theme.palette.getContrastText(theme.palette.grey[500]),
  },
}));

enum DialogMode {
  None,
  Create,
  Edit,
  Delete
}

export const UserManagement: React.FC = () => {
  const classes = useStyles();
  
  // State for users data
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [dialogMode, setDialogMode] = useState<DialogMode>(DialogMode.None);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSuperuser, setIsSuperuser] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  
  // Load users
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const users = await userService.getAllUsers();
      setUsers(users);
      
      // Get current user to prevent self-deletion
      const currentUser = await userService.getCurrentUser();
      setCurrentUserId(currentUser.id);
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
  
  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);
  
  // Handle dialog open/close
  const openCreateDialog = () => {
    // Reset form state
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setIsActive(true);
    setIsSuperuser(false);
    setSelectedUser(null);
    setDialogMode(DialogMode.Create);
  };
  
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEmail(user.email);
    setPassword(''); // Don't set password for edit
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setIsActive(user.is_active);
    setIsSuperuser(user.is_superuser);
    setDialogMode(DialogMode.Edit);
  };
  
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDialogMode(DialogMode.Delete);
  };
  
  const closeDialog = () => {
    setDialogMode(DialogMode.None);
  };
  
  // Handle form submission
  const handleCreateUser = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const userData: UserCreateRequest = {
        email,
        password,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        is_active: isActive,
        is_superuser: isSuperuser,
      };
      
      await userService.createUser(userData);
      closeDialog();
      loadUsers();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create user');
      }
      setLoading(false);
    }
  };
  
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const userData: UserEditRequest = {
        email,
        password: password || undefined, // Only update password if provided
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        is_active: isActive,
        is_superuser: isSuperuser,
      };
      
      await userService.updateUser(selectedUser.id, userData);
      closeDialog();
      loadUsers();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update user');
      }
      setLoading(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await userService.deleteUser(selectedUser.id);
      closeDialog();
      loadUsers();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete user');
      }
      setLoading(false);
    }
  };
  
  return (
    <Paper className={classes.paper}>
      <div className={classes.header}>
        <Typography variant="h5" component="h2">
          User Management
        </Typography>
        
        <div>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openCreateDialog}
            className={classes.actionButton}
          >
            Add User
          </Button>
          
          <IconButton color="primary" onClick={loadUsers}>
            <RefreshIcon />
          </IconButton>
        </div>
      </div>
      
      {error && (
        <Alert severity="error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}
      
      <div className={classes.tableContainer}>
        {loading && (
          <div className={classes.loadingOverlay}>
            <CircularProgress />
          </div>
        )}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.first_name || user.last_name
                      ? `${user.first_name || ''} ${user.last_name || ''}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={user.is_superuser ? <SecurityIcon /> : null}
                      label={user.is_superuser ? 'Admin' : 'User'}
                      className={`${classes.chip} ${
                        user.is_superuser ? classes.adminChip : classes.userChip
                      }`}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={user.is_active ? <CheckIcon /> : <BlockIcon />}
                      label={user.is_active ? 'Active' : 'Inactive'}
                      className={`${classes.chip} ${
                        user.is_active ? classes.statusChip : classes.inactiveChip
                      }`}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => openEditDialog(user)}
                    >
                      <EditIcon />
                    </IconButton>
                    
                    <IconButton
                      color="secondary"
                      onClick={() => openDeleteDialog(user)}
                      disabled={user.id === currentUserId} // Prevent self-deletion
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              
              {users.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No users found
                  </TableCell>