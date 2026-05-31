// src/pages/RegisterAdmin.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SomapBackground from '../components/SomapBackground';
import Button from '../components/Button';
import api from '../api/api';

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.motDePasse !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register-admin', {
        nom: form.nom,
        email: form.email,
        motDePasse: form.motDePasse,
      });

      const { token, role, nom, id } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', nom);
      localStorage.setItem('userId', id.toString());

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du compte admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SomapBackground>
      <div style={styles.card}>
        <div style={styles.accentBar} />
        <h2 style={styles.title}>Créer un administrateur</h2>
        <form ref={formRef} onSubmit={handleSubmit} style={styles.form}>
          <input
            name="nom"
            placeholder="Nom complet"
            value={form.nom}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            name="motDePasse"
            type="password"
            placeholder="Mot de passe"
            value={form.motDePasse}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirmer le mot de passe"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.buttonBox}>
            <Button
              title={loading ? 'Création...' : 'Créer l’administrateur'}
              type="primary"
              onClick={() => formRef.current?.requestSubmit()}
            />
          </div>
        </form>
        <p style={styles.footer}>
          Déjà inscrit ?{' '}
          <span style={styles.link} onClick={() => navigate('/login')}>
            Se connecter
          </span>
        </p>
      </div>
    </SomapBackground>
  );
}

const styles: any = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '22px',
    padding: '0 36px 32px',
    maxWidth: '380px',
    width: '100%',
    boxShadow: '0 4px 32px rgba(18,113,184,0.10)',
  },
  accentBar: {
    width: 'calc(100% + 72px)',
    height: '4px',
    background: 'linear-gradient(90deg, #7EC933 0%, #1271b8 100%)',
    marginBottom: '32px',
    marginLeft: '-36px',
  },
  title: { textAlign: 'center', marginBottom: '24px', color: '#1271b8' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  input: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #ddd',
    fontSize: '14px',
  },
  buttonBox: { marginTop: '8px' },
  error: { color: 'red', fontSize: '13px', textAlign: 'center' },
  footer: { marginTop: '24px', fontSize: '12px', textAlign: 'center' },
  link: { color: '#1271b8', cursor: 'pointer', fontWeight: 500 },
};