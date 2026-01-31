
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';

const ItDashboard = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/requests');
            const itRequests = response.data.filter(r => r.id.startsWith('IT'));
            setRequests(itRequests);
        } catch (error) {
            console.error("Error fetching requests", error);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.post('http://localhost:3000/api/update-status', { id, status });
            fetchRequests();
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    const getStatusBadge = (status) => {
        const s = status.toLowerCase();
        if (s.includes('resolv')) return 'badge badge-resolved';
        if (s.includes('progress')) return 'badge badge-pending'; // Yellow
        if (s.includes('submit')) return 'badge badge-submitted';
        return 'badge badge-info';
    };

    return (
        <DashboardLayout title="IT Support Tickets" userRole="IT">
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Ticket ID</th>
                            <th>Student Info</th>
                            <th>Issue Description</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(req => (
                            <tr key={req.id}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{req.id}</td>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{req.studentName}</div>
                                    <div className="text-sm">Student</div>
                                </td>
                                <td>{req.purpose}</td>
                                <td><span className={getStatusBadge(req.status)}>{req.status}</span></td>
                                <td>
                                    {req.status !== 'Resolved' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => updateStatus(req.id, 'In Progress')} className="btn" style={{ background: '#f59e0b', color: 'black', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>In Progress</button>
                                            <button onClick={() => updateStatus(req.id, 'Resolved')} className="btn btn-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Resolve</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No open IT tickets found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
};

export default ItDashboard;
