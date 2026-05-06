import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('username', formData.username);
        navigate('/dashboard');
      } else {
        setError(JSON.stringify(data.detail) || 'Login failed');
      }
    } catch (err) {
      setError('Could not connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="task-form" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h1>Login</h1>
        {error && <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? <div className="spinner"></div> : 'Login'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#94a3b8' }}>
          Don't have an account? <Link to="/signup" style={{ color: '#6366f1' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
