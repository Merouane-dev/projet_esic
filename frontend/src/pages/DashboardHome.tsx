// frontend/src/pages/DashboardHome.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Box,
  CircularProgress
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import {
  BarChart,
  PieChart,
  Timeline,
  Storage,
  Description,
  Visibility,
  Add,
  LibraryBooks
} from '@material-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { datasetService, Dataset } from '../services/dataset.service';
import { visualizationService, Visualization } from '../services/visualization.service';
import { reportService, Report } from '../services/report.service';
import { auditService, AuditLog } from '../services/audit.service';
import { VisualizationPreview } from '../components/visualizations/VisualizationPreview';

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  cardGrid: {
    marginTop: theme.spacing(2),
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  cardContent: {
    flexGrow: 1,
  },
  title: {
    marginBottom: theme.spacing(2),
  },
  icon: {
    marginRight: theme.spacing(1),
  },
  section: {
    marginTop: theme.spacing(4),
  },
  activityList: {
    width: '100%',
    maxHeight: 320,
    overflow: 'auto',
    backgroundColor: theme.palette.background.paper,
  },
  statsCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  statValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  statLabel: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
  },
  visualizationPreview: {
    height: 200,
    marginBottom: theme.spacing(2),
  },
  actionButton: {
    marginRight: theme.spacing(1),
  },
}));

export const DashboardHome: React.FC = () => {
  const classes = useStyles();
  
  // State for data
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  
  // State for loading and errors
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [loadingVisualizations, setLoadingVisualizations] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const data = await datasetService.getAllDatasets();
        setDatasets(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Failed to load datasets: ${err.message}`);
        }
      } finally {
        setLoadingDatasets(false);
      }
    };
    
    fetchDatasets();
  }, []);
  
  // Load visualizations
  useEffect(() => {
    const fetchVisualizations = async () => {
      try {
        const data = await visualizationService.getAllVisualizations();
        setVisualizations(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Failed to load visualizations: ${err.message}`);
        }
      } finally {
        setLoadingVisualizations(false);
      }
    };
    
    fetchVisualizations();
  }, []);
  
  // Load reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const data = await reportService.getAllReports();
        setReports(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Failed to load reports: ${err.message}`);
        }
      } finally {
        setLoadingReports(false);
      }
    };
    
    fetchReports();
  }, []);
  
  // Load activity
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await auditService.getMyActivity(0, 10);
        setActivity(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(`Failed to load activity: ${err.message}`);
        }
      } finally {
        setLoadingActivity(false);
      }
    };
    
    fetchActivity();
  }, []);
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Get recent visualizations
  const getRecentVisualizations = () => {
    return [...visualizations]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
  };
  
  // Loading indicator
  const isLoading = loadingDatasets || loadingVisualizations || loadingReports || loadingActivity;
  
  return (
    <Container maxWidth="lg" className={classes.container}>
      {error && (
        <Alert severity="error" style={{ marginBottom: '16px' }}>
          {error}
        </Alert>
      )}
      
      <Typography variant="h4" component="h1" className={classes.title}>
        Data Analysis Dashboard
      </Typography>
      
      {isLoading ? (
        <Box display="flex" justifyContent="center" m={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Stats Cards */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper className={classes.statsCard}>
                <Storage fontSize="large" color="primary" />
                <Typography variant="h4" className={classes.statValue}>
                  {datasets.length}
                </Typography>
                <Typography className={classes.statLabel}>
                  Datasets
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper className={classes.statsCard}>
                <BarChart fontSize="large" color="primary" />
                <Typography variant="h4" className={classes.statValue}>
                  {visualizations.length}
                </Typography>
                <Typography className={classes.statLabel}>
                  Visualizations
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper className={classes.statsCard}>
                <Description fontSize="large" color="primary" />
                <Typography variant="h4" className={classes.statValue}>
                  {reports.length}
                </Typography>
                <Typography className={classes.statLabel}>
                  Reports
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Paper className={classes.statsCard}>
                <Visibility fontSize="large" color="primary" />
                <Typography variant="h4" className={classes.statValue}>
                  {visualizations.filter(v => v.is_public).length + reports.filter(r => r.is_public).length}
                </Typography>
                <Typography className={classes.statLabel}>
                  Public Items
                </Typography>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Quick Actions */}
          <Grid container spacing={3} className={classes.section}>
            <Grid item xs={12}>
              <Typography variant="h5" gutterBottom>
                Quick Actions
              </Typography>
              <Box display="flex" flexWrap="wrap">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Add />}
                  className={classes.actionButton}
                  component={RouterLink}
                  to="/datasets/upload"
                >
                  Upload Dataset
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<BarChart />}
                  className={classes.actionButton}
                  component={RouterLink}
                  to="/visualizations/create"
                  disabled={datasets.length === 0}
                >
                  Create Visualization
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Description />}
                  className={classes.actionButton}
                  component={RouterLink}
                  to="/reports/create"
                  disabled={datasets.length === 0}
                >
                  Generate Report
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<LibraryBooks />}
                  className={classes.actionButton}
                  component={RouterLink}
                  to="/datasets"
                >
                  Browse Datasets
                </Button>
              </Box>
            </Grid>
          </Grid>
          
          {/* Recent Visualizations */}
          {visualizations.length > 0 && (
            <div className={classes.section}>
              <Typography variant="h5" gutterBottom>
                Recent Visualizations
              </Typography>
              
              <Grid container spacing={3} className={classes.cardGrid}>
                {getRecentVisualizations().map((visualization) => (
                  <Grid item key={visualization.id} xs={12} sm={6} md={4}>
                    <Card className={classes.card}>
                      <CardContent className={classes.cardContent}>
                        <Typography variant="h6" component="h2">
                          {visualization.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" component="p">
                          {visualization.type.charAt(0).toUpperCase() + visualization.type.slice(1)} Chart
                        </Typography>
                        <div className={classes.visualizationPreview}>
                          <VisualizationPreview 
                            config={JSON.parse(visualization.config)} 
                            data={[]} // We would need to fetch dataset preview data here
                          />
                        </div>
                        {visualization.description && (
                          <Typography variant="body2" color="textSecondary">
                            {visualization.description.length > 100
                              ? visualization.description.substring(0, 100) + '...'
                              : visualization.description}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          color="primary"
                          component={RouterLink}
                          to={`/visualizations/${visualization.id}`}
                        >
                          View
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button 
                  color="primary" 
                  component={RouterLink} 
                  to="/visualizations"
                >
                  View All Visualizations
                </Button>
              </Box>
            </div>
          )}
          
          {/* Recent Datasets & Activity */}
          <Grid container spacing={3} className={classes.section}>
            <Grid item xs={12} md={6}>
              <Paper className={classes.paper}>
                <Typography variant="h6" gutterBottom>
                  Recent Datasets
                </Typography>
                
                {datasets.length > 0 ? (
                  <List className={classes.activityList}>
                    {datasets
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 5)
                      .map((dataset) => (
                        <React.Fragment key={dataset.id}>
                          <ListItem
                            button
                            component={RouterLink}
                            to={`/datasets/${dataset.id}`}
                          >
                            <ListItemText
                              primary={dataset.name}
                              secondary={
                                <>
                                  {dataset.description && (
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      style={{ display: 'block' }}
                                    >
                                      {dataset.description.length > 60
                                        ? dataset.description.substring(0, 60) + '...'
                                        : dataset.description}
                                    </Typography>
                                  )}
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    {formatTimestamp(dataset.created_at)}
                                  </Typography>
                                </>
                              }
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                edge="end"
                                component={RouterLink}
                                to={`/datasets/${dataset.id}/visualize`}
                              >
                                <BarChart />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    No datasets available. Start by uploading your first dataset.
                  </Alert>
                )}
                
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button 
                    color="primary" 
                    component={RouterLink} 
                    to="/datasets"
                  >
                    View All Datasets
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper className={classes.paper}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                
                {activity.length > 0 ? (
                  <List className={classes.activityList}>
                    {activity.map((log) => (
                      <React.Fragment key={log.id}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Typography>
                                <strong>{log.action}</strong> {log.entity_type} #{log.entity_id}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="body2" color="textSecondary">
                                {formatTimestamp(log.timestamp)}
                              </Typography>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info">
                    No recent activity to display.
                  </Alert>
                )}
                
                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button 
                    color="primary" 
                    component={RouterLink} 
                    to="/activity"
                  >
                    View All Activity
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};