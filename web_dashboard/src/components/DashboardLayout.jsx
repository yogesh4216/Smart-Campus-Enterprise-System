
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardLayout = ({ title, children, userRole }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary)', borderRadius: '8px' }}></div>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Smart Campus</span>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <p className="text-sm" style={{ textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Menu</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button className="btn" style={{ justifyContent: 'flex-start', background: 'var(--status-info-bg)', color: 'var(--primary)' }}>
                            {userRole} Dashboard
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#6b7280' }}>
                            {user?.name?.charAt(0)}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ margin: 0, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</p>
                            <p className="text-sm" style={{ margin: 0 }}>{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%' }}>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header style={{ marginBottom: '2rem' }}>
                    <h1 className="text-h1">{title}</h1>
                    <p className="text-sm">Manage and track campus requests.</p>
                </header>

                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
