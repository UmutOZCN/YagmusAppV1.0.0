import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

import { useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const r = await axios.post("/auth/login", { username, password }); // veya '/api/auth/login' senin backend yoluna göre
      // BEARER token döndürüyorsan:
      if (r.data?.token) localStorage.setItem("token", r.data.token);
      if (r.data?.user)  localStorage.setItem("user", JSON.stringify(r.data.user));
      nav("/dashboard");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Login failed";
      setError(msg);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {/* ... inputlar ... */}
      {error && <div style={{color:"#c00"}}>{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}


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
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Yağmuş</h1>
          <p>Aşkımızı her gün notlarla tazelemek için yapıldı 🤍</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Kullanıcı adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Yükleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
          </button>
        </form>

        <div className="toggle-mode">
          <span>
            {isLogin ? "Hesabın yok mu? " : 'Zaten hesabın var mı? '}
          </span>
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="toggle-button"
          >
            {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </div>

        <div className="info-box">
          <p>💑 Bu uygulama özeldir - sadece 2 kullanıcı kayıt olabilir</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

