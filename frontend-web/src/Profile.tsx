import { useState, type FormEvent } from 'react';
import { supabase } from './supabaseClient';
import { useTheme } from './useTheme';

export default function Profile({ userEmail, onSignOut }: { userEmail: string; onSignOut: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setNewConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showMessage('❌ Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage('❌ Les mots de passe ne correspondent pas', 'error');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showMessage('✅ Mot de passe mis à jour', 'success');
      setNewPassword('');
      setNewConfirmPassword('');
    } catch (err) {
      showMessage(`❌ ${err instanceof Error ? err.message : 'Erreur inconnue'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <div className="profile-view">
      <div className="panel profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{initials}</div>
          <div>
            <div className="profile-email">{userEmail}</div>
            <div className="profile-sub">Compte Gestion des Tâches</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">🎨 Apparence</h3>
        <div className="theme-switch-row">
          <span>Thème {theme === 'dark' ? 'sombre' : 'clair'}</span>
          <button
            type="button"
            className={`theme-toggle ${theme === 'dark' ? 'active' : ''}`}
            onClick={toggleTheme}
            aria-label="Basculer le thème"
          >
            <span className="theme-toggle-thumb">{theme === 'dark' ? '🌙' : '☀️'}</span>
          </button>
        </div>
      </div>

      <div className="panel">
        <h3 className="panel-title">🔑 Changer le mot de passe</h3>
        <form className="auth-form" onSubmit={handlePasswordChange}>
          <label className="auth-field">
            <span>Nouveau mot de passe</span>
            <input
              type="password"
              minLength={6}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>
          <label className="auth-field">
            <span>Confirmer le mot de passe</span>
            <input
              type="password"
              minLength={6}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setNewConfirmPassword(e.target.value)}
            />
          </label>
          {message && <div className={`auth-message ${message.type}`}>{message.text}</div>}
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>

      <button className="btn-signout profile-signout" onClick={onSignOut}>
        🚪 Se déconnecter
      </button>
    </div>
  );
}
