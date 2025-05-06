// frontend/src/components/visualizations/VisualizationPreview.tsx
import React, { useEffect, useRef } from 'react';
import { Typography, Box } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import Chart from 'chart.js/auto';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
    height: '100%',
    minHeight: 300,
  },
  errorBox: {
    padding: theme.spacing(2),
    textAlign: 'center',
  },
  chartContainer: {
    width: '100%',
    height: '100%',
    minHeight: 300,
  },
  tableContainer: {
    width: '100%',
    overflowX: 'auto',
    marginTop: theme.spacing(2),
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    '& th, & td': {
      padding: theme.spacing(1),
      border: `1px solid ${theme.palette.divider}`,
    },
    '& th': {
      backgroundColor: theme.palette.background.paper,
    },
    '& tr:nth-child(even)': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));

interface VisualizationPreviewProps {
  config: any;
  data: any[];
}

export const VisualizationPreview: React.FC<VisualizationPreviewProps> = ({ config, data }) => {
  const classes = useStyles();
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  // Helper function to aggregate data
  const aggregateData = (data: any[], xKey: string, yKey: string, colorKey?: string, method: string = 'sum') => {
    const aggregated: Record<string, Record<string, number>> = {};
    
    // Initialize aggregation object
    data.forEach(item => {
      const xValue = String(item[xKey] || 'undefined');
      const colorValue = colorKey ? String(item[colorKey] || 'default') : 'default';
      
      if (!aggregated[xValue]) {
        aggregated[xValue] = {};
      }
      
      if (!aggregated[xValue][colorValue]) {
        aggregated[xValue][colorValue] = 0;
      }
      
      const yValue = Number(item[yKey] || 0);
      
      // Apply aggregation method
      switch (method) {
        case 'sum':
          aggregated[xValue][colorValue] += yValue;
          break;
        case 'average':
          // For average, we'll store sum and count separately and calculate later
          if (!aggregated[xValue][`${colorValue}_count`]) {
            aggregated[xValue][`${colorValue}_count`] = 0;
          }
          aggregated[xValue][colorValue] += yValue;
          aggregated[xValue][`${colorValue}_count`]++;
          break;
        case 'count':
          aggregated[xValue][colorValue]++;
          break;
        case 'min':
          if (aggregated[xValue][colorValue] === 0 || yValue < aggregated[xValue][colorValue]) {
            aggregated[xValue][colorValue] = yValue;
          }
          break;
        case 'max':
          if (yValue > aggregated[xValue][colorValue]) {
            aggregated[xValue][colorValue] = yValue;
          }
          break;
        default:
          aggregated[xValue][colorValue] += yValue;
      }
    });
    
    // Calculate averages if needed
    if (method === 'average') {
      Object.keys(aggregated).forEach(xValue => {
        Object.keys(aggregated[xValue]).forEach(colorValue => {
          if (colorValue.endsWith('_count')) return;
          
          const count = aggregated[xValue][`${colorValue}_count`] || 1;
          aggregated[xValue][colorValue] = aggregated[xValue][colorValue] / count;
        });
      });
    }
    
    return aggregated;
  };
  
  // Prepare chart data from aggregated data
  const prepareChartData = (aggregatedData: Record<string, Record<string, number>>, colorKey?: string) => {
    const labels = Object.keys(aggregatedData);
    
    // If no color grouping, create a single dataset
    if (!colorKey || colorKey === '') {
      const values = labels.map(label => aggregatedData[label]['default']);
      
      return {
        labels,
        datasets: [{
          label: config.yAxis,
          data: values,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      };
    } else {
      // With color grouping, create multiple datasets
      const colorValues = new Set<string>();
      
      // Get all unique color values
      Object.values(aggregatedData).forEach(colorDict => {
        Object.keys(colorDict).forEach(colorValue => {
          if (!colorValue.endsWith('_count')) {
            colorValues.add(colorValue);
          }
        });
      });
      
      // Create datasets for each color value
      const datasets = Array.from(colorValues).map((colorValue, index) => {
        const values = labels.map(label => {
          return aggregatedData[label][colorValue] || 0;
        });
        
        // Generate colors based on index
        const hue = (index * 137) % 360; // Golden angle approximation for nice color distribution
        
        return {
          label: colorValue,
          data: values,
          backgroundColor: `hsla(${hue}, 70%, 60%, 0.6)`,
          borderColor: `hsla(${hue}, 70%, 60%, 1)`,
          borderWidth: 1
        };
      });
      
      return {
        labels,
        datasets
      };
    }
  };
  
  // Render chart based on config and data
  useEffect(() => {
    if (!chartRef.current || !config || !data || data.length === 0) return;
    
    // Cleanup previous chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    const { type, xAxis, yAxis, colorBy, aggregation } = config;
    
    // Skip if required props are missing
    if (!xAxis || !yAxis) return;
    
    // Aggregate data based on configuration
    const aggregatedData = aggregateData(data, xAxis, yAxis, colorBy, aggregation);
    const chartData = prepareChartData(aggregatedData, colorBy);
    
    // Chart.js configuration
    const chartConfig: any = {
      type: type === 'table' ? 'bar' : type, // Default to bar for table view (won't be shown)
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: yAxis
            }
          },
          x: {
            title: {
              display: true,
              text: xAxis
            }
          }
        },
        plugins: {
          legend: {
            display: !!colorBy,
            position: 'top',
          },
          title: {
            display: false
          }
        }
      }
    };
    
    // Create chart except for table type
    if (type !== 'table') {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, chartConfig);
      }
    }
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [config, data]);
  
  // Handle different visualization types
  if (!config || !data || data.length === 0) {
    return (
      <Box className={classes.errorBox}>
        <Alert severity="info">
          No data available for preview
        </Alert>
      </Box>
    );
  }
  
  // Render table view
  if (config.type === 'table') {
    return (
      <div className={classes.tableContainer}>
        <table className={classes.table}>
          <thead>
            <tr>
              {Object.keys(data[0]).map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {Object.values(row).map((cell, cellIndex) => (
                  <td key={cellIndex}>
                    {cell !== null ? String(cell) : 'NULL'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  // Render chart view
  return (
    <div className={classes.container}>
      <Box className={classes.chartContainer}>
        <canvas ref={chartRef}></canvas>
      </Box>
    </div>
  );
};
