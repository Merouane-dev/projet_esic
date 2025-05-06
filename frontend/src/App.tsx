// frontend/src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import CssBaseline from '@material-ui/core/CssBaseline';
import { createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { blue, teal } from '@material-ui/core/colors';

// Layout
import { MainLayout } from './components/layout/MainLayout';

// Auth
import { Login } from './views/Login';
import { SignUp } from './views/SignUp';
import { PrivateRoute } from './components/common/PrivateRoute';
import { AdminRoute } from './components/common/AdminRoute';

// Dashboard
import { DashboardHome } from './pages/DashboardHome';

// Datasets
import { DatasetList } from './pages/datasets/DatasetList';
import { DatasetDetail } from './pages/datasets/DatasetDetail';
import { DatasetUpload } from './components/datasets/DatasetUpload';

// Visualizations
import { VisualizationList } from './pages/visualizations/VisualizationList';
import { VisualizationDetail } from './pages/visualizations/VisualizationDetail';
import { VisualizationCreator } from './components/visualizations/VisualizationCreator';

// Reports
import { ReportList } from './pages/reports/ReportList';
import { ReportDetail } from './pages/reports/ReportDetail';
import { ReportCreator } from './components/reports/ReportCreator';

// Admin
import { UserManagement } from './components/admin/UserManagement';
import { AuditLogs } from './components/admin/AuditLogs';

// 404
import { NotFound } from './pages/NotFound';

// Create a theme
const theme = createMuiTheme({
  palette: {
    primary: blue,
    secondary: teal,
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/signup" component={SignUp} />
          
          <PrivateRoute path="/dashboard" component={() => (
            <MainLayout>
              <DashboardHome />
            </MainLayout>
          )} />
          
          {/* Datasets */}
          <PrivateRoute path="/datasets/upload" component={() => (
            <MainLayout>
              <DatasetUpload />
            </MainLayout>
          )} />
          
          <PrivateRoute path="/datasets/:datasetId/visualize" component={() => (
            <MainLayout>
              <VisualizationCreator />
            </MainLayout>
          )} />
          
          <PrivateRoute path="/datasets/:datasetId" component={() => (
            <MainLayout>
              <DatasetDetail />
            </MainLayout>
          )} />
          
          <PrivateRoute path="/datasets" component={() => (
            <MainLayout>
              <DatasetList />
            </MainLayout>
          )} />
          
          {/* Visualizations */}
          <PrivateRoute path="/visualizations/create" component={() => (
            <MainLayout>
              <VisualizationCreator />
            </MainLayout>
          )} />
          
          <PrivateRoute path="/visualizations/:visualizationId" component={() => (
            <MainLayout>
              <VisualizationDetail />
            </MainLayout>
          )} />
          
          <PrivateRoute path="/visualizations" component={() => (
            <MainLayout>
              <VisualizationList />
            </MainLayout>
          )} />
          
          {/* Reports */}
          <PrivateRoute path="/reports/create" component={() => (
            <MainLayout>
              <ReportCreator />
            </MainLayout>
          )} />
          
          <PrivateRoute path="/reports/:reportId" component={() => (
            <MainLayout>
              <ReportDetail />
            </MainLayout>
          )} />
          
          <PrivateRoute path="/reports" component={() => (
            <MainLayout>
              <ReportList />
            </MainLayout>
          )} />
          
          {/* Admin */}
          <AdminRoute path="/admin/users" component={() => (
            <MainLayout>
              <UserManagement />
            </MainLayout>
          )} />
          
          <AdminRoute path="/admin/audit" component={() => (
            <MainLayout>
              <AuditLogs />
            </MainLayout>
          )} />
          
          {/* User activity */}
          <PrivateRoute path="/activity" component={() => (
            <MainLayout>
              <AuditLogs />
            </MainLayout>
          )} />
          
          {/* Redirects and 404 */}
          <Redirect exact from="/" to="/dashboard" />
          <Route component={() => (
            <MainLayout>
              <NotFound />
            </MainLayout>
          )} />
        </Switch>
      </Router>
    </ThemeProvider>
  );
};

export default App;
