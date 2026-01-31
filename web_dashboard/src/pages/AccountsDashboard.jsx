
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import Modal from '../components/Modal';

const AccountsDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);
    const [modalType, setModalType] = useState(null); // 'reject' | 'info' | 'approve'
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 5000); // Poll
        return () => clearInterval(interval);
    }, []);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('http://localhost:3000/api/requests');
            // Filter for Finance Requests (FIN-xxxx)
            const accountRequests = response.data.filter(r => r.id.startsWith('FIN'));
            setRequests(accountRequests);
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
        <DashboardLayout title="Accounts Office" userRole="Accounts">
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Receipt ID</th>
                            <th>Student Info</th>
                            <th>Purpose</th>
                            <th>Payment Status</th>
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
                                <td>{req.purpose || req.requestType}</td>
                                <td style={{ color: 'green', fontWeight: 'bold' }}>PAID</td>
                                <td><span className={getStatusBadge(req.status)}>{req.status}</span></td>
                                <td>
                                    {req.status !== 'Approved' && req.status !== 'Rejected' && (
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => openActionModal(req, 'approve')} className="btn btn-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Generate Receipt</button>
                                            <button onClick={() => openActionModal(req, 'reject')} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Reject</button>
                                        </div>
                                    )}
                                    {req.status === 'Approved' && <button className="btn btn-outline" disabled>Receipt Sent</button>}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    No pending accounts requests.
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
                title={modalType === 'approve' ? 'Confirm Receipt Generation' : 'Reject Request'}
            >
                {modalType === 'approve' ? (
                    <p>Confirm payment verification? This will generate the Official Fee Receipt PDF.</p>
                ) : (
                    <div className="input-group">
                        <label className="input-label">Reason for Rejection</label>
                        <textarea
                            className="input-field"
                            rows="3"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder='e.g., Payment ID invalid'
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

export default AccountsDashboard;
