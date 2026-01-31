
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import Modal from '../components/Modal';

const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);
    const [modalType, setModalType] = useState(null); // 'reject' | 'info' | 'approve'
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/requests');
            const adminRequests = response.data.filter(r => r.id.startsWith('ADM'));
            setRequests(adminRequests);
        } catch (error) {
            console.error("Error fetching requests", error);
        }
    };

    const openActionModal = (req, type) => {
        setSelectedReq(req);
        setModalType(type);
        setInputText('');
    };

    const closeActionModal = () => {
        setSelectedReq(null);
        setModalType(null);
        setInputText('');
    };

    const submitAction = async () => {
        if (!selectedReq) return;
        setLoading(true);

        try {
            const payload = {
                requestId: selectedReq.id,
                action: modalType === 'reject' ? 'Reject' : modalType === 'info' ? 'RequestInfo' : 'Approve',
            };

            if (modalType === 'reject') payload.reason = inputText;
            if (modalType === 'info') payload.missingInfo = inputText;

            await axios.post('http://localhost:3000/api/admin/action', payload);

            await fetchRequests();
            closeActionModal();
        } catch (error) {
            console.error("Action failed", error);
            alert("Action failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const s = status.toLowerCase();
        if (s.includes('approve')) return 'badge badge-approved';
        if (s.includes('reject')) return 'badge badge-rejected';
        if (s.includes('wait')) return 'badge badge-info';
        if (s.includes('submit')) return 'badge badge-submitted';
        return 'badge badge-pending';
    };

    return (
        <DashboardLayout title="Administrative Requests" userRole="Admin">
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Request ID</th>
                            <th>Student Info</th>
                            <th>Purpose</th>
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
                                    <div className="text-sm">{req.studentId}</div>
                                </td>
                                <td>{req.purpose}</td>
                                <td><span className={getStatusBadge(req.status)}>{req.status}</span></td>
                                <td>
                                    {req.status !== 'Approved' && req.status !== 'Rejected' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => openActionModal(req, 'approve')} className="btn btn-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Approve</button>
                                            <button onClick={() => openActionModal(req, 'reject')} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Reject</button>
                                            <button onClick={() => openActionModal(req, 'info')} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Ask Info</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No pending requests.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Action Modal */}
            <Modal
                isOpen={!!modalType}
                onClose={closeActionModal}
                title={modalType === 'approve' ? 'Confirm Approval' : modalType === 'reject' ? 'Reject Request' : 'Request More Information'}
            >
                {modalType === 'approve' ? (
                    <p>Are you sure you want to approve this request? A Bonafide Certificate PDF will be automatically generated and sent to the student.</p>
                ) : (
                    <div className="input-group">
                        <label className="input-label">
                            {modalType === 'reject' ? 'Reason for Rejection' : 'What information is missing?'}
                        </label>
                        <textarea
                            className="input-field"
                            rows="3"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={modalType === 'reject' ? 'e.g., Fees not paid' : 'e.g., Send ID proof'}
                        />
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.5rem' }}>
                    <button onClick={closeActionModal} className="btn btn-outline">Cancel</button>
                    <button
                        onClick={submitAction}
                        className={`btn ${modalType === 'reject' ? 'btn-danger' : 'btn-primary'}`}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Confirm'}
                    </button>
                </div>
            </Modal>
        </DashboardLayout>
    );
};

export default AdminDashboard;
