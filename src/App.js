import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

const API_URL = 'http://localhost:8080/api/tasks';

function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', due_date: '' });
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchTasks();
    }
  }, [token, navigate]);

  const fetchTasks = async () => {
    try {
      const response = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        handleLogout();
        return;
      }
      const data = await response.json();
      setTasks(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!formData.title) return;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setFormData({ title: '', description: '', due_date: '' });
        fetchTasks();
      } else {
        const errorData = await response.json();
        alert('Failed to add task: ' + JSON.stringify(errorData.detail));
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const toggleComplete = async (task) => {
    try {
      const newStatus = !task.completed;
      await fetch(`${API_URL}/${task.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: newStatus }),
      });
      
      if (newStatus) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1000);
      }
      
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return (
    <div className="App">
      {showCelebration && <div className="celebration">Well Done! 🎉</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Task Manager</h1>
        <div style={{ textAlign: 'right' }}>
          <span style={{ color: '#94a3b8', marginRight: '1rem' }}>Welcome, {username}</span>
          <button onClick={handleLogout} className="btn" style={{ background: '#334155', color: 'white', padding: '0.5rem 1rem' }}>Logout</button>
        </div>
      </div>

      <div className="task-form">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              placeholder="What needs to be done?"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              name="description"
              placeholder="Add some details..."
              value={formData.description}
              onChange={handleInputChange}
              rows="2"
            />
          </div>
          <div className="form-group">
            <label>Due Date</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
            />
          </div>
          <button type="submit" className="btn btn-primary">Add Task</button>
        </form>
      </div>

      <div className="task-list">
        {loading ? (
          <div className="empty-state">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">No tasks yet. Add one above!</div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-info">
                <h3 className={`task-title ${task.completed ? 'completed' : ''}`}>
                  {task.title}
                </h3>
                {task.description && <p className="task-desc">{task.description}</p>}
                <div className="task-meta">
                  {task.due_date && <span>📅 {task.due_date}</span>}
                  <span style={{ marginLeft: '1rem' }}>
                    Created: {new Date(task.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="task-actions">
                <button
                  className="btn-icon btn-complete"
                  onClick={() => toggleComplete(task)}
                >
                  {task.completed ? '↩️' : '✅'}
                </button>
                <button
                  className="btn-icon btn-delete"
                  onClick={() => deleteTask(task.id)}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
