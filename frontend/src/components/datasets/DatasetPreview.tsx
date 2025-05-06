// frontend/src/components/datasets/DatasetPreview.tsx
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
  CircularProgress,
  Tabs,
  Tab,
  Box
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { datasetService, Dataset, DatasetResponse } from '../../services/dataset.service';

interface DatasetPreviewProps {
  datasetId: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  table: {
    minWidth: 650,
  },
  tableContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  statCard: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
  },
}));

export const DatasetPreview: React.FC<DatasetPreviewProps> = ({ datasetId }) => {
  const classes = useStyles();
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [analysisData, setAnalysisData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch dataset metadata
        const dataset = await datasetService.getDataset(datasetId);
        setDataset(dataset);
        
        // Fetch preview data
        const preview = await datasetService.previewDataset(datasetId);
        setPreviewData(preview);
        
        // Fetch analysis data
        const analysis = await datasetService.analyzeDataset(datasetId);
        setAnalysisData(analysis);
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
    
    fetchData();
  }, [datasetId]);

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <div className={classes.loading}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  if (!dataset) {
    return (
      <Alert severity="info">
        No dataset found
      </Alert>
    );
  }

  return (
    <Paper className={classes.paper}>
      <div className={classes.header}>
        <div>
          <Typography component="h1" variant="h5">
            {dataset.name}
          </Typography>
          {dataset.description && (
            <Typography variant="body2" color="textSecondary">
              {dataset.description}
            </Typography>
          )}
        </div>
        <Button variant="contained" color="primary" href={`/datasets/${datasetId}/visualize`}>
          Create Visualization
        </Button>
      </div>
      
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="dataset tabs">
        <Tab label="Preview" />
        <Tab label="Analysis" />
        <Tab label="Information" />
      </Tabs>
      
      <TabPanel value={tabValue} index={0}>
        {previewData.length > 0 ? (
          <TableContainer component={Paper} className={classes.tableContainer}>
            <Table className={classes.table} size="small">
              <TableHead>
                <TableRow>
                  {Object.keys(previewData[0]).map((key) => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {previewData.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {Object.values(row).map((cell, cellIndex) => (
                      <TableCell key={cellIndex}>
                        {cell !== null ? String(cell) : 'NULL'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No preview data available</Alert>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        {analysisData ? (
          <div>
            {analysisData.summary && (
              <>
                <Typography variant="h6">Statistical Summary</Typography>
                <TableContainer component={Paper} className={classes.tableContainer}>
                  <Table className={classes.table} size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Statistic</TableCell>
                        {Object.keys(analysisData.summary).map((column) => (
                          <TableCell key={column}>{column}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map((stat) => (
                        <TableRow key={stat}>
                          <TableCell><strong>{stat}</strong></TableCell>
                          {Object.keys(analysisData.summary).map((column) => (
                            <TableCell key={`${column}-${stat}`}>
                              {analysisData.summary[column][stat] !== undefined 
                                ? Number(analysisData.summary[column][stat]).toFixed(2) 
                                : 'N/A'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
            
            {analysisData.missing_values && Object.keys(analysisData.missing_values).length > 0 && (
              <>
                <Typography variant="h6">Missing Values</Typography>
                <TableContainer component={Paper} className={classes.tableContainer}>
                  <Table className={classes.table} size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Column</TableCell>
                        <TableCell>Missing Count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(analysisData.missing_values).map(([column, count]) => (
                        <TableRow key={column}>
                          <TableCell>{column}</TableCell>
                          <TableCell>{count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
            
            {analysisData.data_types && (
              <>
                <Typography variant="h6">Data Types</Typography>
                <TableContainer component={Paper} className={classes.tableContainer}>
                  <Table className={classes.table} size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Column</TableCell>
                        <TableCell>Type</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(analysisData.data_types).map(([column, type]) => (
                        <TableRow key={column}>
                          <TableCell>{column}</TableCell>
                          <TableCell>{String(type)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </div>
        ) : (
          <Alert severity="info">No analysis data available</Alert>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6">Dataset Information</Typography>
        
        <Paper className={classes.statCard}>
          <Typography variant="body1">
            <strong>File Type:</strong> {dataset.file_type.toUpperCase()}
          </Typography>
          <Typography variant="body1">
            <strong>Rows:</strong> {dataset.row_count || 'Unknown'}
          </Typography>
          <Typography variant="body1">
            <strong>Columns:</strong> {dataset.column_count || 'Unknown'}
          </Typography>
          <Typography variant="body1">
            <strong>Created:</strong> {new Date(dataset.created_at).toLocaleString()}
          </Typography>
          <Typography variant="body1">
            <strong>Last Updated:</strong> {new Date(dataset.updated_at).toLocaleString()}
          </Typography>
          <Typography variant="body1">
            <strong>Visibility:</strong> {dataset.is_public ? 'Public' : 'Private'}
          </Typography>
        </Paper>
        
        <Typography variant="h6">Columns</Typography>
        
        <TableContainer component={Paper} className={classes.tableContainer}>
          <Table className={classes.table} size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Nullable</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dataset.columns.map((column) => (
                <TableRow key={column.id}>
                  <TableCell>{column.name}</TableCell>
                  <TableCell>{column.data_type}</TableCell>
                  <TableCell>{column.is_nullable ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{column.description || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>
    </Paper>
  );
};