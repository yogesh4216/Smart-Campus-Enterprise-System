
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);

        if (result.success) {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user.role === 'Admin') navigate('/admin');
            else if (user.role === 'IT') navigate('/it');
            else if (user.role === 'Accounts') navigate('/accounts');
            else navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="auth-container">
            <div className="card" style={{ maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 className="text-h1" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Smart Campus</h1>
                    <p className="text-sm">Office Portal Access</p>
                </div>

                {error && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem', textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <input
                            className="input-field"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. admin@college.edu"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            className="input-field"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <p className="text-sm" style={{ marginBottom: '0.5rem' }}>Demo Credentials:</p>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <span className="badge badge-info">admin@college.edu / admin</span>
                        <span className="badge badge-info">it@college.edu / it</span>
                        <span className="badge badge-info">accounts@college.edu / acc</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
