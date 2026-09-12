import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/src/context/AuthContext';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { ProtectedRoute } from '@/src/components/auth/ProtectedRoute';
import { AppShell } from '@/src/components/layout/AppShell';
import { HomePage } from '@/src/pages/HomePage';
import { LoginPage } from '@/src/pages/LoginPage';
import { ClearanceDashboardPage } from '@/src/pages/ClearanceDashboardPage';
import { RBACTestPage } from '@/src/pages/RBACTestPage';
import { HealthPage } from '@/src/pages/HealthPage';
import { UIShowcasePage } from '@/src/pages/UIShowcasePage';
import { DatabaseSchemaPage } from '@/src/pages/DatabaseSchemaPage';
import { ClearanceWorkflowTestPage } from '@/src/pages/ClearanceWorkflowTestPage';
import { AuditTrailPage } from '@/src/pages/AuditTrailPage';
import { SuperAdminPage } from '@/src/pages/SuperAdminPage';
import { ReportsPage } from '@/src/pages/ReportsPage';
import { PublicCertificateVerificationPage } from '@/src/pages/PublicCertificateVerificationPage';
import { EvaluationPage } from '@/src/pages/EvaluationPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppShell>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/verify/certificate/:certificateNumber" element={<PublicCertificateVerificationPage />} />
              <Route path="/verify/certificate" element={<PublicCertificateVerificationPage />} />
              <Route path="/evaluation" element={<EvaluationPage />} />
              <Route
                path="/clearance-dashboard"
                element={
                  <ProtectedRoute>
                    <ClearanceDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <SuperAdminPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'REGISTRY', 'DEAN', 'HOD', 'BURSAR', 'LIBRARIAN', 'STUDENT_AFFAIRS', 'ICT_DIRECTOR']}>
                    <ReportsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit-trail"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'REGISTRY']}>
                    <AuditTrailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rbac-security"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <RBACTestPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/database"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <DatabaseSchemaPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workflow-simulator"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <ClearanceWorkflowTestPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/health" element={<HealthPage />} />
              {import.meta.env.DEV && (
                <Route
                  path="/ui-showcase"
                  element={
                    <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                      <UIShowcasePage />
                    </ProtectedRoute>
                  }
                />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppShell>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
  );
}
