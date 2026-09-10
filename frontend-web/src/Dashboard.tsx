import { useMemo } from 'react';

interface Task {
  id: number;
  title: string;
  is_verified: boolean;
  priority: string;
  created_at: string;
}

export default function Dashboard({ tasks }: { tasks: Task[] }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.is_verified).length;
    const pending = total - done;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    const byPriority = { haute: 0, moyenne: 0, basse: 0 } as Record<string, number>;
    tasks.forEach((t) => {
      byPriority[t.priority] = (byPriority[t.priority] ?? 0) + 1;
    });

    const now = new Date();
    const days: { label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = tasks.filter((t) => {
        const created = new Date(t.created_at);
        return created >= dayStart && created < dayEnd;
      }).length;
      days.push({ label: dayStart.toLocaleDateString('fr-FR', { weekday: 'short' }), count });
    }

    return { total, done, pending, rate, byPriority, days };
  }, [tasks]);

  const maxDay = Math.max(1, ...stats.days.map((d) => d.count));

  return (
    <div className="dashboard-view">
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-icon">📋</span>
          <div>
            <div className="kpi-value">{stats.total}</div>
            <div className="kpi-label">Tâches totales</div>
          </div>
        </div>
        <div className="kpi-card">
          <span className="kpi-icon">✅</span>
          <div>
            <div className="kpi-value">{stats.done}</div>
            <div className="kpi-label">Terminées</div>
          </div>
        </div>
        <div className="kpi-card">
          <span className="kpi-icon">⏳</span>
          <div>
            <div className="kpi-value">{stats.pending}</div>
            <div className="kpi-label">En attente</div>
          </div>
        </div>
        <div className="kpi-card kpi-highlight">
          <span className="kpi-icon">📈</span>
          <div>
            <div className="kpi-value">{stats.rate}%</div>
            <div className="kpi-label">Taux de complétion</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h3 className="panel-title">🎯 Répartition par priorité</h3>
          <div className="priority-bars">
            {(['haute', 'moyenne', 'basse'] as const).map((p) => {
              const count = stats.byPriority[p] ?? 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              const icon = p === 'haute' ? '🔴' : p === 'moyenne' ? '🟡' : '🟢';
              return (
                <div className="priority-bar-row" key={p}>
                  <span className="priority-bar-label">
                    {icon} {p.charAt(0).toUpperCase() + p.slice(1)}
                  </span>
                  <div className="priority-bar-track">
                    <div className={`priority-bar-fill priority-bar-${p}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="priority-bar-count">{count}</span>
                </div>
              );
            })}
            {stats.total === 0 && <p className="panel-empty">Aucune donnée pour le moment.</p>}
          </div>
        </div>

        <div className="panel">
          <h3 className="panel-title">📅 Activité des 7 derniers jours</h3>
          <div className="activity-chart">
            {stats.days.map((d, i) => (
              <div className="activity-col" key={i}>
                <div className="activity-bar-track">
                  <div
                    className="activity-bar-fill"
                    style={{ height: `${(d.count / maxDay) * 100}%` }}
                    title={`${d.count} tâche(s)`}
                  />
                </div>
                <span className="activity-label">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
