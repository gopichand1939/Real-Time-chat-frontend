import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';  // Import the updated Login.css

function Login() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      navigate('/chat', { state: { username } });
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Welcome to the Chat!</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          className="username-input"
          placeholder="Enter your name..."
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit" className="join-button">Join Chat</button>
      </form>
    </div>
  );
}

export default Login;
