import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import { format, isPast, parseISO } from 'date-fns';

const STATUSES = ['todo', 'in_progress', 'done'];
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const STATUS_ICONS = { todo: '○', in_progress: '◑', done: '●' };
const STATUS_COLORS = { todo: 'var(--text3)', in_progress: 'var(--info)', done: 'var(--success)' };

const EMPTY_TASK = { title: '', description: '', status: 'todo', priority: 'medium', assigned_to: '', due_date: '' };

// Toast component
function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === 'success' ? '✅' : '❌'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('board');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({ email: '', role: 'member' });
  const [memberError, setMemberError] = useState('');
  const [toasts, setToasts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const fetchAll = useCallback(() => {
    Promise.all([
      API.get(`/projects/${projectId}`),
      API.get(`/tasks/project/${projectId}`)
    ])
      .then(([projRes, tasksRes]) => {
        setProject(projRes.data);
        setTasks(tasksRes.data);
      })
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [projectId, navigate]);

  useEffect(fetchAll, [fetchAll]);

  const isAdmin = project?.userRole === 'admin';

  const tasksByStatus = STATUSES.reduce((acc, s) => {
    let filtered = tasks.filter(t => t.status === s);
    if (filterPriority !== 'all') filtered = filtered.filter(t => t.priority === filterPriority);
    acc[s] = filtered;
    return acc;
  }, {});

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm(EMPTY_TASK);
    setTaskError('');
    setShowTaskModal(true);
  };

  const openEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : ''
    });
    setTaskError('');
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async e => {
    e.preventDefault();
    setTaskError('');
    setTaskSubmitting(true);
    try {
      const payload = {
        ...taskForm,
        assigned_to: taskForm.assigned_to || null,
        due_date: taskForm.due_date || null
      };
      if (editingTask) {
        await API.put(`/tasks/${editingTask.id}`, payload);
        showToast('Task updated successfully');
      } else {
        await API.post(`/tasks/project/${projectId}`, payload);
        showToast('Task created successfully');
      }
      setShowTaskModal(false);
      fetchAll();
    } catch (err) {
      setTaskError(err.response?.data?.error || 'Failed to save task.');
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      showToast('Task deleted');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete task.', 'error');
    }
  };

  const handleQuickStatus = async (task, newStatus) => {
    try {
      await API.put(`/tasks/${task.id}`, { ...task, status: newStatus, assigned_to: task.assigned_to || null });
      showToast(`Moved to ${STATUS_LABELS[newStatus]}`);
      fetchAll();
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and ALL its tasks? This cannot be undone.')) return;
    try {
      await API.delete(`/projects/${projectId}`);
      navigate('/projects');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete.', 'error');
    }
  };

  const handleAddMember = async e => {
    e.preventDefault();
    setMemberError('');
    try {
      await API.post(`/projects/${projectId}/members`, memberForm);
      setShowMemberModal(false);
      setMemberForm({ email: '', role: 'member' });
      showToast('Member added successfully');
      fetchAll();
    } catch (err) {
      setMemberError(err.response?.data?.error || 'Failed to add member.');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await API.delete(`/projects/${projectId}/members/${userId}`);
      showToast('Member removed');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to remove member.', 'error');
    }
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <span style={{ color: 'var(--text2)', fontSize: 14 }}>Loading project...</span>
    </div>
  );
  if (!project) return null;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="container">
      <Toast toasts={toasts} />

      {/* Breadcrumb */}
      <div className="breadcrumb mb-4">
        <span onClick={() => navigate('/projects')}>Projects</span>
        {' › '}
        <span style={{ color: 'var(--text)' }}>{project.name}</span>
      </div>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="text-muted">{project.description}</p>}
          <div className="flex-gap" style={{ marginTop: 12 }}>
            <span className={`badge badge-${project.userRole}`}>{project.userRole}</span>
            <span className="text-muted" style={{ fontSize: 13 }}>
              👥 {project.members?.length || 0} members
            </span>
            <span className="text-muted" style={{ fontSize: 13 }}>
              {doneTasks}/{totalTasks} tasks done
            </span>
          </div>
          {/* Mini progress bar */}
          {totalTasks > 0 && (
            <div style={{ marginTop: 12, width: 200 }}>
              <div className="progress-bar-wrap">
                <div className={`progress-bar-fill${progress === 100 ? ' complete' : ''}`} style={{ width: `${progress}%` }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{progress}% complete</div>
            </div>
          )}
        </div>

        <div className="flex-gap">
          <button className="btn btn-primary btn-sm" onClick={openCreateTask}>
            + Add Task
          </button>
          {isAdmin && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
              Delete Project
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {['board', 'members'].map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'board' ? `📋 Board (${tasks.length})` : `👥 Members (${project.members?.length || 0})`}
          </button>
        ))}
      </div>

      {/* BOARD TAB */}
      {tab === 'board' && (
        <>
          {/* Filters */}
          <div className="flex-gap mb-4" style={{ justifyContent: 'flex-end' }}>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="board">
            {STATUSES.map(status => (
              <div key={status} className={`column column-${status}`}>
                <div className="column-header">
                  <span className="column-title" style={{ color: STATUS_COLORS[status] }}>
                    {STATUS_ICONS[status]} {STATUS_LABELS[status]}
                  </span>
                  <span className="column-count">{tasksByStatus[status].length}</span>
                </div>

                {tasksByStatus[status].length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text3)', fontSize: 13 }}>
                    No tasks here
                  </div>
                )}

                {tasksByStatus[status].map(task => {
                  const isOverdue = task.due_date && task.status !== 'done' && isPast(parseISO(task.due_date));
                  return (
                    <div key={task.id} className={`task-card ${isOverdue ? 'overdue' : ''}`}>
                      <div className="task-card-title">{task.title}</div>

                      <div className="task-card-meta">
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        {isOverdue && <span className="badge badge-high">overdue</span>}
                      </div>

                      {task.description && (
                        <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, lineHeight: 1.5 }}>
                          {task.description.length > 80 ? task.description.slice(0, 80) + '...' : task.description}
                        </p>
                      )}

                      <div className="task-card-footer">
                        <div className="task-assignee">
                          {task.assignee_name ? (
                            <>
                              <div className="assignee-dot">{task.assignee_name.charAt(0)}</div>
                              <span>{task.assignee_name}</span>
                            </>
                          ) : (
                            <span style={{ color: 'var(--text3)' }}>Unassigned</span>
                          )}
                        </div>
                        {task.due_date && (
                          <div className={`task-due ${isOverdue ? 'overdue-text' : ''}`}>
                            {isOverdue ? '⚠ ' : '📅 '}
                            {format(parseISO(task.due_date), 'MMM d')}
                          </div>
                        )}
                      </div>

                      <div className="task-actions">
                        <button className="btn btn-ghost btn-xs" onClick={() => openEditTask(task)}>Edit</button>
                        {/* Quick status buttons */}
                        {status !== 'todo' && (
                          <button className="btn btn-ghost btn-xs" onClick={() => handleQuickStatus(task, 'todo')}>→ Todo</button>
                        )}
                        {status !== 'in_progress' && (
                          <button className="btn btn-ghost btn-xs" onClick={() => handleQuickStatus(task, 'in_progress')}>→ In Progress</button>
                        )}
                        {status !== 'done' && (
                          <button className="btn btn-ghost btn-xs" style={{ color: 'var(--success)' }} onClick={() => handleQuickStatus(task, 'done')}>→ Done ✓</button>
                        )}
                        {(isAdmin || task.created_by === user?.id) && (
                          <button className="btn btn-danger btn-xs" style={{ marginLeft: 'auto' }} onClick={() => handleDeleteTask(task.id)}>Del</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* MEMBERS TAB */}
      {tab === 'members' && (
        <div>
          {isAdmin && (
            <div className="flex-between mb-4">
              <h2 className="section-title" style={{ margin: 0 }}>Team Members</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowMemberModal(true)}>
                + Add Member
              </button>
            </div>
          )}

          {project.members?.map(member => (
            <div key={member.id} className="member-item">
              <div className="member-avatar">{member.name.charAt(0)}</div>
              <div className="member-info">
                <div className="member-name">
                  {member.name}
                  {member.id === user?.id && <span style={{ color: 'var(--text3)', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>(you)</span>}
                </div>
                <div className="member-email">{member.email}</div>
              </div>
              <div className="flex-gap">
                <span className={`badge badge-${member.role}`}>{member.role}</span>
                {isAdmin && member.id !== user?.id && (
                  <button className="btn btn-danger btn-xs" onClick={() => handleRemoveMember(member.id)}>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TASK MODAL */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowTaskModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTask ? 'Edit Task' : '+ New Task'}</h2>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>×</button>
            </div>

            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-input"
                  value={taskForm.title}
                  onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="What needs to be done?"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={taskForm.description}
                  onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Add more details..."
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={taskForm.status}
                    onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={taskForm.priority}
                    onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select
                    className="form-select"
                    value={taskForm.assigned_to}
                    onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {project.members?.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={taskForm.due_date}
                    onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                  />
                </div>
              </div>

              {taskError && <p className="error-msg mb-4">⚠ {taskError}</p>}

              <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={taskSubmitting}>
                  {taskSubmitting ? 'Saving...' : editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMemberModal(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Team Member</h2>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>×</button>
            </div>

            <p className="text-muted" style={{ fontSize: 13, marginBottom: 20 }}>
              The user must already have a TaskFlow account. Enter their email to add them.
            </p>

            <form onSubmit={handleAddMember}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={memberForm.email}
                  onChange={e => setMemberForm({ ...memberForm, email: e.target.value })}
                  placeholder="teammate@example.com"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={memberForm.role}
                  onChange={e => setMemberForm({ ...memberForm, role: e.target.value })}
                >
                  <option value="member">Member — can create & update tasks</option>
                  <option value="admin">Admin — full project control</option>
                </select>
              </div>
              {memberError && <p className="error-msg mb-4">⚠ {memberError}</p>}
              <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
