// src/pages/Login.tsx
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SomapBackground from '../components/SomapBackground';
import Button from '../components/Button';
import api from '../api/api';

export default function Login() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        motDePasse: password,
      });

      const { token, role, nom, id } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', nom);
      localStorage.setItem('userId', id.toString());

      if (role === 'ADMIN') {
        navigate('/dashboard');
      } else {
        // If somehow a client logs in, redirect to a generic page or show error
        setError('Accès réservé aux administrateurs.');
        localStorage.clear();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Échec de connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SomapBackground>
      <div style={styles.card}>
        <div style={styles.accentBar} />
        <h2 style={styles.title}>Connexion Administrateur</h2>
        <form ref={formRef} onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          <div style={styles.buttonBox}>
            <Button
              title={loading ? 'Connexion...' : 'Se connecter'}
              type="primary"
              onClick={() => formRef.current?.requestSubmit()}
            />
          </div>
        </form>
        {/* No client registration link */}
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
};