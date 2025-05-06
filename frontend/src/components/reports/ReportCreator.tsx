// frontend/src/components/reports/ReportCreator.tsx
import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Grid,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Card,
  CardContent,
  Box
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { Add, Delete, ArrowUpward, ArrowDownward } from '@material-ui/icons';
import { useHistory, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { visualizationService, Visualization } from '../../services/visualization.service';
import { reportService, ReportCreateRequest } from '../../services/report.service';
import { datasetService, DatasetResponse } from '../../services/dataset.service';
import { VisualizationPreview } from '../visualizations/VisualizationPreview';

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
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  visualizationsList: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    maxHeight: 300,
    overflow: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  selectedVisualizationsList: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  previewContainer: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
  },
  visualizationPreview: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
    height: 300,
  },
  editorContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  markdownPreview: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: '#fff',
    minHeight: 300,
    maxHeight: 500,
    overflow: 'auto',
  },
}));

interface ParamTypes {
  datasetId: string;
}

export const ReportCreator: React.FC = () => {
  const classes = useStyles();
  const history = useHistory();
  const { datasetId } = useParams<ParamTypes>();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  const [dataset, setDataset] = useState<DatasetResponse | null>(null);
  const [visualizations, setVisualizations] = useState<Visualization[]>([]);
  const [selectedVisualizations, setSelectedVisualizations] = useState<Visualization[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load dataset and available visualizations
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const id = parseInt(datasetId);
        
        // Fetch dataset
        const dataset = await datasetService.getDataset(id);
        setDataset(dataset);
        
        // Fetch preview data for visualizations
        const preview = await datasetService.previewDataset(id);
        setPreviewData(preview);
        
        // Fetch available visualizations for this dataset
        const visualizations = await visualizationService.getDatasetVisualizations(id);
        setVisualizations(visualizations);
        
        // Generate starter content template
        const template = `# ${dataset.name} Report

## Overview
This report provides an analysis of the ${dataset.name} dataset.

## Key Findings
* Finding 1
* Finding 2
* Finding 3

## Visualizations
Visualizations are displayed below.

## Conclusion
Summary of the insights gained from this dataset.
`;
        setContent(template);
        
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
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!dataset) {
      setError('Dataset not loaded');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const reportData: ReportCreateRequest = {
        name,
        description,
        content,
        is_public: isPublic,
        dataset_id: parseInt(datasetId),
        visualization_ids: selectedVisualizations.map(viz => viz.id),
      };
      
      const report = await reportService.createReport(reportData);
      
      // Redirect to report view
      history.push(`/reports/${report.id}`);
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
  
  const addVisualization = (visualization: Visualization) => {
    setSelectedVisualizations([...selectedVisualizations, visualization]);
  };
  
  const removeVisualization = (index: number) => {
    const newSelected = [...selectedVisualizations];
    newSelected.splice(index, 1);
    setSelectedVisualizations(newSelected);
  };
  
  const moveVisualizationUp = (index: number) => {
    if (index === 0) return;
    
    const newSelected = [...selectedVisualizations];
    const temp = newSelected[index];
    newSelected[index] = newSelected[index - 1];
    newSelected[index - 1] = temp;
    
    setSelectedVisualizations(newSelected);
  };
  
  const moveVisualizationDown = (index: number) => {
    if (index === selectedVisualizations.length - 1) return;
    
    const newSelected = [...selectedVisualizations];
    const temp = newSelected[index];
    newSelected[index] = newSelected[index + 1];
    newSelected[index + 1] = temp;
    
    setSelectedVisualizations(newSelected);
  };
  
  const addVisualizationPlaceholder = () => {
    // Add visualization placeholder to markdown content
    const placeholder = `\n\n## Visualization ${selectedVisualizations.length + 1}\n*Visualization will be displayed here*\n\n`;
    setContent(content + placeholder);
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
        Create Report
      </Typography>
      
      {error && (
        <Alert severity="error" style={{ marginTop: '16px' }}>
          {error}
        </Alert>
      )}
      
      <form className={classes.form} onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="name"
              label="Report Name"
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
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  color="primary"
                />
              }
              label="Make this report public"
            />
            
            <Typography variant="h6" style={{ marginTop: '16px' }}>
              Available Visualizations
            </Typography>
            
            {visualizations.length > 0 ? (
              <List className={classes.visualizationsList}>
                {visualizations.map((viz) => (
                  <ListItem key={viz.id} button onClick={() => addVisualization(viz)}>
                    <ListItemText
                      primary={viz.name}
                      secondary={viz.type.charAt(0).toUpperCase() + viz.type.slice(1) + ' Chart'}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => addVisualization(viz)}>
                        <Add />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" style={{ marginTop: '16px' }}>
                No visualizations available for this dataset. Create visualizations first.
              </Alert>
            )}
            
            <Typography variant="h6" style={{ marginTop: '16px' }}>
              Selected Visualizations
            </Typography>
            
            {selectedVisualizations.length > 0 ? (
              <List className={classes.selectedVisualizationsList}>
                {selectedVisualizations.map((viz, index) => (
                  <ListItem key={viz.id}>
                    <ListItemText
                      primary={viz.name}
                      secondary={viz.type.charAt(0).toUpperCase() + viz.type.slice(1) + ' Chart'}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => moveVisualizationUp(index)} disabled={index === 0}>
                        <ArrowUpward />
                      </IconButton>
                      <IconButton edge="end" onClick={() => moveVisualizationDown(index)} disabled={index === selectedVisualizations.length - 1}>
                        <ArrowDownward />
                      </IconButton>
                      <IconButton edge="end" onClick={() => removeVisualization(index)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info" style={{ marginTop: '16px' }}>
                No visualizations selected yet
              </Alert>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              className={classes.submit}
              disabled={loading || !name || content.trim() === ''}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Report'}
            </Button>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <div className={classes.editorContainer}>
              <Typography variant="h6">Report Content (Markdown)</Typography>
              
              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="content"
                name="content"
                multiline
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              
              <Button
                variant="outlined"
                color="primary"
                onClick={addVisualizationPlaceholder}
                style={{ marginTop: '8px', alignSelf: 'flex-start' }}
              >
                Add Visualization Placeholder
              </Button>
              
              <Typography variant="h6" style={{ marginTop: '16px' }}>
                Preview
              </Typography>
              
              <div className={classes.markdownPreview}>
                <ReactMarkdown>{content}</ReactMarkdown>
                
                {selectedVisualizations.map((viz, index) => (
                  <Card key={viz.id} className={classes.visualizationPreview}>
                    <CardContent>
                      <Typography variant="h6">{viz.name}</Typography>
                      <div style={{ height: 200 }}>
                        <VisualizationPreview 
                          config={JSON.parse(viz.config)} 
                          data={previewData}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};