import { useState, useEffect, useMemo } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import { useAuth } from './useAuth';
import { useTheme } from './useTheme';
import AuthScreen from './AuthScreen';
import Dashboard from './Dashboard';
import Profile from './Profile';

interface Task {
  id: number;
  title: string;
  is_verified: boolean;
  priority: string;
  created_at: string;
}

function App() {
  const { session, loading: authLoading } = useAuth();
  useTheme();

  if (authLoading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <TaskManager userEmail={session.user.email ?? ''} />;
}

function TaskManager({ userEmail }: { userEmail: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [priority, setPriority] = useState('moyenne');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [filterPriority, setFilterPriority] = useState('toutes');
  const [filterDate, setFilterDate] = useState('toutes');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [view, setView] = useState<'tasks' | 'dashboard' | 'profile'>('tasks');

  useEffect(() => {
    fetchTasks();

    const subscription = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [filterPriority, filterDate]);

  const fetchTasks = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterPriority !== 'toutes') {
        query = query.eq('priority', filterPriority);
      }

      if (filterDate === 'aujourdhui') {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        query = query.gte('created_at', start.toISOString()).lt('created_at', end.toISOString());
      } else if (filterDate === 'cette_semaine') {
        const now = new Date();
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay() + 1);
        const end = new Date(start);
        end.setDate(start.getDate() + 7);
        query = query.gte('created_at', start.toISOString()).lt('created_at', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error(err);
      showMessage('❌ Erreur de chargement', 'error');
    } finally {
      if (showRefresh) setRefreshing(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const addTask = async () => {
    if (!newTask.trim()) {
      showMessage('❌ Veuillez saisir une tâche', 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .insert([{ title: newTask.trim(), priority }]);
      if (error) throw error;
      setNewTask('');
      showMessage('✅ Tâche ajoutée !', 'success');
    } catch {
      showMessage('❌ Erreur lors de l\'ajout', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await supabase.from('tasks').delete().eq('id', id);
      showMessage('🗑️ Tâche supprimée', 'success');
    } catch {
      showMessage('❌ Erreur de suppression', 'error');
    }
  };

  const verifyTask = async (id: number) => {
    try {
      await supabase.from('tasks').update({ is_verified: true }).eq('id', id);
      showMessage('✅ Tâche vérifiée', 'success');
    } catch {
      showMessage('❌ Erreur de vérification', 'error');
    }
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveEditing = async (id: number) => {
    if (!editingTitle.trim()) {
      showMessage('❌ Le titre ne peut pas être vide', 'error');
      return;
    }
    try {
      const { error } = await supabase.from('tasks').update({ title: editingTitle.trim() }).eq('id', id);
      if (error) throw error;
      showMessage('✅ Tâche modifiée', 'success');
      cancelEditing();
    } catch {
      showMessage('❌ Erreur de modification', 'error');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const visibleTasks = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, search]);

  const completedCount = tasks.filter((t) => t.is_verified).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const getPriorityClass = (p: string) => {
    if (p === 'haute') return 'priority-high';
    if (p === 'basse') return 'priority-low';
    return 'priority-medium';
  };

  const getPriorityIcon = (p: string) => {
    if (p === 'haute') return '🔴';
    if (p === 'basse') return '🟢';
    return '🟡';
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="app-wrapper">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📋 Gestion des Tâches <span className="badge">Stage</span></h1>
          <p className="sub">Interface Manager — Suivez l'avancement de votre ingénieur</p>
        </div>
        <div className="header-right">
          <div className="status-pulse">
            <span className="pulse-dot"></span> Synchronisé
          </div>
          <div className="user-chip" title={userEmail}>
            👤 {userEmail}
          </div>
          <button className="btn-signout" onClick={handleSignOut} title="Se déconnecter">
            🚪 Déconnexion
          </button>
        </div>
      </header>

      <nav className="tab-nav">
        <button className={`tab-btn ${view === 'tasks' ? 'active' : ''}`} onClick={() => setView('tasks')}>
          ✅ Tâches
        </button>
        <button className={`tab-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}>
          📊 Tableau de bord
        </button>
        <button className={`tab-btn ${view === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>
          👤 Profil
        </button>
      </nav>

      {view === 'dashboard' && (
        <main className="main-card">
          <Dashboard tasks={tasks} />
        </main>
      )}

      {view === 'profile' && (
        <main className="main-card">
          <Profile userEmail={userEmail} onSignOut={handleSignOut} />
        </main>
      )}

      {view === 'tasks' && (
        <main className="main-card">
          {/* Barre de progression */}
          <div className="stats-row">
            <span className="stat-item">
              ✅ <span className="num">{completedCount}</span> / {tasks.length} vérifiées
            </span>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Filtres */}
          <div className="filter-row">
            <div className="filter-group">
              {['toutes', 'haute', 'moyenne', 'basse'].map((p) => (
                <button
                  key={p}
                  className={`filter-chip ${filterPriority === p ? 'active' : ''}`}
                  onClick={() => setFilterPriority(p)}
                >
                  {p === 'toutes' ? '📌 Toutes' : getPriorityIcon(p) + ' ' + p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <div className="filter-group">
              {['toutes', 'aujourdhui', 'cette_semaine'].map((d) => (
                <button
                  key={d}
                  className={`filter-chip ${filterDate === d ? 'active' : ''}`}
                  onClick={() => setFilterDate(d)}
                >
                  {d === 'toutes' ? '📅 Toutes' : d === 'aujourdhui' ? '📅 Aujourd\'hui' : '📅 Cette semaine'}
                </button>
              ))}
            </div>
          </div>

          {/* Recherche */}
          <div className="search-row">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Rechercher une tâche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Formulaire d'ajout */}
          <div className="input-group">
            <input
              type="text"
              placeholder="Saisissez une nouvelle tâche..."
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
            />
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="haute">🔴 Haute</option>
              <option value="moyenne">🟡 Moyenne</option>
              <option value="basse">🟢 Basse</option>
            </select>
            <button className="btn-primary" onClick={addTask} disabled={loading}>
              {loading ? 'Ajout...' : '➕ Ajouter'}
            </button>
          </div>

          {message && <div className={`message ${message.type}`}>{message.text}</div>}

          {/* Liste des tâches */}
          <div className="list-header">
            <h3>📌 Tâches en cours <span className="count-badge">{visibleTasks.length}</span></h3>
            <button className="btn-refresh-small" onClick={() => fetchTasks(true)} disabled={refreshing}>
              {refreshing ? '⏳' : '🔄'}
            </button>
          </div>

          <ul className="task-list">
            {visibleTasks.map((task) => (
              <li key={task.id} className={`task-item ${task.is_verified ? 'verified' : ''}`}>
                {editingId === task.id ? (
                  <div className="task-edit-row">
                    <input
                      type="text"
                      className="task-edit-input"
                      value={editingTitle}
                      autoFocus
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEditing(task.id);
                        if (e.key === 'Escape') cancelEditing();
                      }}
                    />
                    <button className="btn-verify" onClick={() => saveEditing(task.id)} title="Enregistrer">
                      💾
                    </button>
                    <button className="btn-delete" onClick={cancelEditing} title="Annuler">
                      ✖️
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="task-left">
                      <div className={`status-dot ${task.is_verified ? 'done' : 'pending'}`} />
                      <span className={`task-title ${task.is_verified ? 'done' : ''}`}>{task.title}</span>
                    </div>
                    <div className="task-meta">
                      <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </span>
                      <span className="task-date">🕒 {formatDate(task.created_at)}</span>
                      {task.is_verified && <span className="verified-badge">✓ Vérifiée</span>}
                    </div>
                    <div className="task-actions">
                      {!task.is_verified && (
                        <button className="btn-verify" onClick={() => verifyTask(task.id)} title="Vérifier">
                          ✅
                        </button>
                      )}
                      <button className="btn-edit" onClick={() => startEditing(task)} title="Modifier">
                        ✏️
                      </button>
                      <button className="btn-delete" onClick={() => deleteTask(task.id)} title="Supprimer">
                        🗑️
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
            {visibleTasks.length === 0 && tasks.length > 0 && (
              <div className="empty-state">
                <span>🔍</span>
                <p>Aucune tâche ne correspond à votre recherche.</p>
              </div>
            )}
            {tasks.length === 0 && (
              <div className="empty-state">
                <span>📭</span>
                <p>Aucune tâche pour le moment. Ajoutez-en une !</p>
              </div>
            )}
          </ul>

          <button className="btn-refresh" onClick={() => fetchTasks(true)} disabled={refreshing}>
            {refreshing ? '⏳ Rafraîchissement...' : '🔄 Rafraîchir la liste'}
          </button>
        </main>
      )}
    </div>
  );
}

export default App;