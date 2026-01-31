
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ItDashboard from './pages/ItDashboard';
import AccountsDashboard from './pages/AccountsDashboard';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" />;
    if (allowedRole && user.role !== allowedRole) return <Navigate to="/login" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRole="Admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/it"
                        element={
                            <ProtectedRoute allowedRole="IT">
                                <ItDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/accounts"
                        element={
                            <ProtectedRoute allowedRole="Accounts">
                                <AccountsDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="*" element={<Navigate to="/login" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
