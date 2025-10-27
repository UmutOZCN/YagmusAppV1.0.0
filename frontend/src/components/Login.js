// frontend/src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const response = await axios.post(endpoint, { username, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Login/register error', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <h1>Yağmuş</h1>
      <p>Aşkımızı her gün notlarla tazelemek için yapıldı</p>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Kullanıcı adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
        />

        <input
          placeholder="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />

        {error && <div className="error-box">{error}</div>}

        <button type="submit" className="primary">
          {loading ? 'Yükleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
        </button>
      </form>

      <div className="toggle-row">
        {isLogin ? "Hesabın yok mu? " : 'Zaten hesabın var mı? '}
        <button onClick={() => setIsLogin(!isLogin)} className="toggle-button">
          {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
        </button>
      </div>

      <p className="note">Bu uygulama özeldir - sadece 2 kullanıcı kayıt olabilir</p>
    </div>
  );
};

export default Login;
