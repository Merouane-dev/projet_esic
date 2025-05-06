// frontend/src/components/datasets/DatasetUpload.tsx
import React, { useState } from 'react';
import { 
  Button, 
  TextField, 
  FormControlLabel, 
  Checkbox, 
  Grid, 
  Paper, 
  Typography,
  CircularProgress 
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { CloudUpload } from '@material-ui/icons';
import { datasetService, DatasetCreateRequest } from '../../services/dataset.service';
import { useHistory } from 'react-router-dom';

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
  uploadArea: {
    border: '2px dashed #ccc',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(3),
    textAlign: 'center',
    cursor: 'pointer',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  fileInput: {
    display: 'none',
  },
  fileName: {
    marginTop: theme.spacing(1),
  },
}));

export const DatasetUpload: React.FC = () => {
  const classes = useStyles();
  const history = useHistory();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };
  
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    if (!name) {
      setError('Please enter a name for the dataset');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const fileType = file.name.split('.').pop()?.toLowerCase();
      if (!fileType || !['csv', 'xlsx', 'xls'].includes(fileType)) {
        throw new Error('Unsupported file type. Please upload CSV or Excel files.');
      }
      
      const datasetData: DatasetCreateRequest = {
        name,
        description,
        is_public: isPublic,
        file_type: fileType,
      };
      
      const dataset = await datasetService.uploadDataset(datasetData, file);
      
      // Redirect to dataset preview
      history.push(`/datasets/${dataset.id}`);
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
  
  return (
    <Paper className={classes.paper}>
      <Typography component="h1" variant="h5">
        Upload New Dataset
      </Typography>
      
      {error && (
        <Alert severity="error" style={{ marginTop: '16px' }}>
          {error}
        </Alert>
      )}
      
      <form className={classes.form} onSubmit={handleSubmit} noValidate>
        <TextField
          variant="outlined"
          margin="normal"
          required
          fullWidth
          id="name"
          label="Dataset Name"
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
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        
        <input
          accept=".csv,.xlsx,.xls"
          className={classes.fileInput}
          id="file-upload"
          type="file"
          onChange={handleFileChange}
        />
        
        <label htmlFor="file-upload">
          <div className={classes.uploadArea}>
            <CloudUpload fontSize="large" />
            <Typography variant="body1">
              Drag and drop a file here, or click to select a file
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Accepted formats: CSV, XLSX, XLS
            </Typography>
            {file && (
              <Typography className={classes.fileName} variant="body2">
                Selected file: {file.name}
              </Typography>
            )}
          </div>
        </label>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              color="primary"
            />
          }
          label="Make this dataset public"
        />
        
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          className={classes.submit}
          disabled={loading || !file || !name}
        >
          {loading ? <CircularProgress size={24} /> : 'Upload Dataset'}
        </Button>
      </form>
    </Paper>
  );
};