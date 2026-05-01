import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchProjects = () => {
    setLoading(true);
    API.get('/projects')
      .then(res => setProjects(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchProjects, []);

  const handleCreate = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await API.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchProjects();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <span style={{ color: 'var(--text2)', fontSize: 14 }}>Loading projects...</span>
    </div>
  );

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="text-muted">{projects.length} project{projects.length !== 1 ? 's' : ''} you belong to</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state card" style={{ padding: '70px 24px' }}>
          <div className="empty-icon">📁</div>
          <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: 8 }}>No projects yet</p>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            Create your first project to start tracking tasks with your team.
          </p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Create first project
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {projects.map((project, idx) => {
            const progress = project.task_count > 0
              ? Math.round((project.done_count / project.task_count) * 100)
              : 0;
            return (
              <div
                key={project.id}
                className="card card-hover"
                style={{ animationDelay: `${idx * 0.05}s`, animation: 'slideUp 0.25s ease both' }}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span className={`badge badge-${project.role}`}>{project.role}</span>
                  <span className="text-muted" style={{ fontSize: 12 }}>
                    👥 {project.member_count} member{project.member_count !== 1 ? 's' : ''}
                  </span>
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '8px', fontFamily: 'Syne, sans-serif', letterSpacing: '-0.2px' }}>
                  {project.name}
                </h3>

                {project.description && (
                  <p className="text-muted" style={{ marginBottom: '16px', fontSize: '13px', lineHeight: '1.55' }}>
                    {project.description.length > 90 ? project.description.slice(0, 90) + '...' : project.description}
                  </p>
                )}

                <div style={{ marginTop: project.description ? 0 : 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="text-muted" style={{ fontSize: '12px' }}>
                      {project.done_count}/{project.task_count} tasks done
                    </span>
                    <span style={{
                      fontSize: '12px', fontWeight: 700,
                      color: progress === 100 ? 'var(--success)' : progress > 0 ? 'var(--accent2)' : 'var(--text3)'
                    }}>
                      {progress}%
                    </span>
                  </div>
                  <div className="progress-bar-wrap">
                    <div
                      className={`progress-bar-fill${progress === 100 ? ' complete' : ''}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>By {project.owner_name}</span>
                  <span>{new Date(project.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Marketing Campaign Q1"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-textarea"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="What is this project about?"
                  rows={3}
                />
              </div>
              {error && <p className="error-msg mb-4">⚠ {error}</p>}
              <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
