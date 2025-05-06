// frontend/src/components/visualizations/VisualizationCreator.tsx
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Divider,
  FormHelperText,
  Box
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory, useParams } from 'react-router-dom';
import { visualizationService, VisualizationCreateRequest } from '../../services/visualization.service';
import { datasetService, DatasetResponse } from '../../services/dataset.service';
import { VisualizationPreview } from './VisualizationPreview';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  form: {
    width: '100%',
    marginTop: theme.spacing(1),
  },
  formControl: {
    margin: theme.spacing(1, 0),
    minWidth: 200,
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  preview: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    minHeight: 400,
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  columnSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
}));

interface ParamTypes {
  datasetId: string;
}

export const VisualizationCreator: React.FC = () => {
  const classes = useStyles();
  const history = useHistory();
  const { datasetId } = useParams<ParamTypes>();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [type, setType] = useState('bar');
  const [config, setConfig] = useState<any>({});
  
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields for specific visualization types
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [colorBy, setColorBy] = useState('');
  const [aggregation, setAggregation] = useState('sum');
  
  useEffect(() => {
    const fetchDatasetInfo = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const id = parseInt(datasetId);
        const dataset = await datasetService.getDataset(id);
        setDataset(dataset);
        
        const preview = await datasetService.previewDataset(id);
        setPreviewData(preview);
        
        // Set default X and Y axis if columns are available
        if (preview.length > 0) {
          const columns = Object.keys(preview[0]);
          if (columns.length > 0) {
            // Try to find a string column for X axis and numeric for Y axis
            const stringColumns = columns.filter(col => 
              typeof preview[0][col] === 'string' || preview[0][col] instanceof String
            );
            const numericColumns = columns.filter(col => 
              typeof preview[0][col] === 'number'
            );
            
            if (stringColumns.length > 0) {
              setXAxis(stringColumns[0]);
            } else {
              setXAxis(columns[0]);
            }
            
            if (numericColumns.length > 0) {
              setYAxis(numericColumns[0]);
            } else if (columns.length > 1) {
              setYAxis(columns[1]);
            } else {
              setYAxis(columns[0]);
            }
          }
        }
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
    
    fetchDatasetInfo();
  }, [datasetId]);
  
  // Update config when form fields change
  useEffect(() => {
    if (!dataset || !xAxis || !yAxis) return;
    
    let newConfig: any = {
      type,
      data: previewData,
      xAxis,
      yAxis,
      colorBy: colorBy || undefined,
      aggregation,
    };
    
    setConfig(newConfig);
  }, [type, xAxis, yAxis, colorBy, aggregation, previewData, dataset]);
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!dataset) {
      setError('Dataset not loaded');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const visualizationData: VisualizationCreateRequest = {
        name,
        description,
        type,
        config: JSON.stringify(config),
        is_public: isPublic,
        dataset_id: parseInt(datasetId),
      };
      
      const visualization = await visualizationService.createVisualization(visualizationData);
      
      // Redirect to visualization view
      history.push(`/visualizations/${visualization.id}`);
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
  
  // Get available columns from preview data
  const getAvailableColumns = () => {
    if (!previewData || previewData.length === 0) return [];
    return Object.keys(previewData[0]);
  };
  
  // Get numeric columns only
  const getNumericColumns = () => {
    if (!previewData || previewData.length === 0) return [];
    
    return Object.keys(previewData[0]).filter(col => 
      typeof previewData[0][col] === 'number'
    );
  };
  
  if (loading && !dataset) {
    return (
      <Box display="flex" justifyContent="center" m={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper className={classes.paper}>
      <Typography component="h1" variant="h5">
        Create Visualization
      </Typography>
      
      {error && (
        <Alert severity="error" style={{ marginTop: '16px' }}>
          {error}
        </Alert>
      )}
      
      <form className={classes.form} onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="name"
              label="Visualization Name"
              name="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="description"
              label="Description"
              name="description"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            <FormControl variant="outlined" className={classes.formControl} fullWidth margin="normal">
              <InputLabel id="type-label">Visualization Type</InputLabel>
              <Select
                labelId="type-label"
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as string)}
                label="Visualization Type"
              >
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="line">Line Chart</MenuItem>
                <MenuItem value="pie">Pie Chart</MenuItem>
                <MenuItem value="scatter">Scatter Plot</MenuItem>
                <MenuItem value="area">Area Chart</MenuItem>
                <MenuItem value="table">Table</MenuItem>
              </Select>
            </FormControl>
            
            <div className={classes.columnSelector}>
              <FormControl variant="outlined" className={classes.formControl} fullWidth>
                <InputLabel id="x-axis-label">X Axis</InputLabel>
                <Select
                  labelId="x-axis-label"
                  id="x-axis"
                  value={xAxis}
                  onChange={(e) => setXAxis(e.target.value as string)}
                  label="X Axis"
                >
                  {getAvailableColumns().map((column) => (
                    <MenuItem key={column} value={column}>{column}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl variant="outlined" className={classes.formControl} fullWidth>
                <InputLabel id="y-axis-label">Y Axis</InputLabel>
                <Select
                  labelId="y-axis-label"
                  id="y-axis"
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value as string)}
                  label="Y Axis"
                >
                  {getAvailableColumns().map((column) => (
                    <MenuItem key={column} value={column}>{column}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {['bar', 'line', 'scatter'].includes(type) && (
                <FormControl variant="outlined" className={classes.formControl} fullWidth>
                  <InputLabel id="color-by-label">Color By (Optional)</InputLabel>
                  <Select
                    labelId="color-by-label"
                    id="color-by"
                    value={colorBy}
                    onChange={(e) => setColorBy(e.target.value as string)}
                    label="Color By (Optional)"
                  >
                    <MenuItem value="">None</MenuItem>
                    {getAvailableColumns().map((column) => (
                      <MenuItem key={column} value={column}>{column}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              {['bar', 'pie'].includes(type) && (
                <FormControl variant="outlined" className={classes.formControl} fullWidth>
                  <InputLabel id="aggregation-label">Aggregation Method</InputLabel>
                  <Select
                    labelId="aggregation-label"
                    id="aggregation"
                    value={aggregation}
                    onChange={(e) => setAggregation(e.target.value as string)}
                    label="Aggregation Method"
                  >
                    <MenuItem value="sum">Sum</MenuItem>
                    <MenuItem value="average">Average</MenuItem>
                    <MenuItem value="count">Count</MenuItem>
                    <MenuItem value="min">Minimum</MenuItem>
                    <MenuItem value="max">Maximum</MenuItem>
                  </Select>
                </FormControl>
              )}
            </div>
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  color="primary"
                />
              }
              label="Make this visualization public"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              disabled={loading || !name || !xAxis || !yAxis}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Visualization'}
            </Button>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6">Preview</Typography>
            
            <Paper className={classes.preview}>
              {dataset && config.type && (
                <VisualizationPreview 
                  config={config} 
                  data={previewData} 
                />
              )}
            </Paper>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};
