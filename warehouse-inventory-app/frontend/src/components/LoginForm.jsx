import { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [login, setLogin] = useState('admin');
  const [haslo, setHaslo] = useState('Admin123!');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onLogin(login, haslo);
    } catch (err) {
      setError(err?.response?.data?.error || 'Błąd logowania');
    }
  };

  return (
    <form className="card" onSubmit={submit}>
      <h2>Logowanie</h2>
      <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Login" />
      <input value={haslo} onChange={(e) => setHaslo(e.target.value)} placeholder="Hasło" type="password" />
      {error && <div className="error">{error}</div>}
      <button type="submit">Zaloguj</button>
    </form>
  );
}
