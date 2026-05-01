import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { format, isPast, parseISO } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/tasks/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <span style={{ color: 'var(--text2)', fontSize: 14 }}>Loading your dashboard...</span>
    </div>
  );

  const { stats, recentTasks } = data || { stats: {}, recentTasks: [] };
  const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

  const statCards = [
    { value: stats.my_tasks || 0, label: 'Assigned to me', icon: '📋', color: 'var(--accent2)' },
    { value: stats.my_in_progress || 0, label: 'In Progress', icon: '🔄', color: 'var(--info)' },
    { value: stats.my_done || 0, label: 'Completed', icon: '✅', color: 'var(--success)' },
    { value: stats.overdue || 0, label: 'Overdue', icon: '⚠️', color: 'var(--danger)' },
  ];

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-muted">Here's what's happening with your tasks today.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/projects')}>
          View Projects →
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="flex-between mb-4">
        <h2 className="section-title" style={{ margin: 0 }}>My Recent Tasks</h2>
        {recentTasks.length > 0 && (
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>{recentTasks.length} tasks</span>
        )}
      </div>

      {recentTasks.length === 0 ? (
        <div className="empty-state card" style={{ padding: '60px 24px' }}>
          <div className="empty-icon">🎉</div>
          <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>All caught up!</p>
          <p className="text-muted">No tasks assigned to you yet. Join or create a project to get started.</p>
          <button className="btn btn-primary mt-4" onClick={() => navigate('/projects')}>
            Go to Projects
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recentTasks.map((task, idx) => {
            const isOverdue = task.due_date && task.status !== 'done' && isPast(parseISO(task.due_date));
            return (
              <div
                key={task.id}
                className={`card card-hover ${isOverdue ? 'overdue' : ''}`}
                style={{ padding: '16px 20px', animationDelay: `${idx * 0.04}s`, animation: 'slideUp 0.2s ease both' }}
                onClick={() => navigate(`/projects/${task.project_id}`)}
              >
                <div className="flex-between">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: 14 }}>{task.title}</div>
                    <div className="flex-gap">
                      <span className={`badge badge-${task.status}`}>{statusLabel[task.status]}</span>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      <span className="text-muted" style={{ fontSize: 12 }}>in {task.project_name}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', marginLeft: 16 }}>
                    {task.due_date && (
                      <div style={{ fontSize: 12, color: isOverdue ? 'var(--danger)' : 'var(--text3)', fontWeight: isOverdue ? 600 : 400 }}>
                        {isOverdue ? '⚠ Overdue · ' : 'Due '}
                        {format(parseISO(task.due_date), 'MMM d')}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>→ Open project</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
