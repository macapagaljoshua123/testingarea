import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Signup successful! You can now log in.');
        navigate('/login');
      } else {
        setError(JSON.stringify(data.detail) || 'Signup failed');
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
        <h1>Sign Up</h1>
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
            {isLoading ? <div className="spinner"></div> : 'Create Account'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#94a3b8' }}>
          Already have an account? <Link to="/login" style={{ color: '#6366f1' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
