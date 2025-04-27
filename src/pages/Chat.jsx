import { useLocation } from 'react-router-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import './Chat.css';

// ✅ Connect to your backend server
const socket = io('https://real-time-chat-backend-8vmz.onrender.com', {
  transports: ['websocket'],  // ⚡ Force WebSocket transport
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

function Chat() {
  const location = useLocation();
  const { username } = location.state || {};

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [offlineUsers, setOfflineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState('');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const handleTyping = useCallback(
    debounce(() => {
      if (username) socket.emit('typing');
    }, 500),
    [username]
  );

  useEffect(() => {
    socket.on('connect', () => console.log('Connected to socket server'));
    socket.on('disconnect', () => console.log('Disconnected from socket server'));

    if (username) {
      console.log('Joining with username:', username);
      socket.emit('join', username);
    }

    socket.on('chatHistory', (previousMessages) => {
      console.log('Previous messages received:', previousMessages);
      setMessages(previousMessages);
    });

    socket.on('onlineUsers', (users) => {
      console.log('Online users:', users);
      setOnlineUsers(users);
    });

    socket.on('offlineUsers', (users) => {
      console.log('Offline users:', users);
      setOfflineUsers(users);
    });

    socket.on('broadcastMessage', (data) => {
      console.log('Broadcast received:', data);
      setMessages((prev) => [...prev, data]);
    });

    socket.on('userTyping', (user) => {
      console.log(`${user} is typing`);
      setTypingUser(user);
      if (typingTimeout) clearTimeout(typingTimeout);
      const timeout = setTimeout(() => setTypingUser(''), 2000);
      setTypingTimeout(timeout);
    });

    socket.on('userDisconnected', (user) => {
      console.log(`${user} went offline.`);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('chatHistory');
      socket.off('onlineUsers');
      socket.off('offlineUsers');
      socket.off('broadcastMessage');
      socket.off('userTyping');
      socket.off('userDisconnected');
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [username, typingTimeout]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !username) return;
    console.log('Attempting to send message:', message);
    socket.emit('chatMessage', message);
    console.log('Message emitted, waiting for broadcast');
    setMessage('');
    setTypingUser('');
    if (typingTimeout) clearTimeout(typingTimeout);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]);

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1 className="chat-title">{username}</h1>
        <div className="user-status">
          {onlineUsers.length > 0 && (
            <div className="status-section">
              <h3>Online</h3>
              <ul className="user-list">
                {[...new Set(onlineUsers)].map((user, i) => (
                  <li key={i} className="user-item">
                    <span className="online-dot"></span> {user}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {offlineUsers.length > 0 && (
            <div className="status-section">
              <h3>Offline</h3>
              <ul className="user-list">
                {[...new Set(offlineUsers)].map((user, i) => (
                  <li key={i} className="user-item">
                    <span className="offline-dot"></span> {user}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      <div className="message-container">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message-wrapper ${
              msg.username === username ? 'my-message' : 'other-message'
            }`}
          >
            <div className="message-header">
              <span className="username">{msg.username}</span>
              {onlineUsers.includes(msg.username) && (
                <span className="online-status">
                  <span className="online-dot"></span>
                </span>
              )}
            </div>
            <div className="message-bubble">
              <span className="message-content">{msg.message}</span>
              <span className="message-time">{msg.time}</span>
            </div>
          </div>
        ))}
        {typingUser && (
          <div className="message-wrapper other-message">
            <div className="message-header">
              <span className="username">{typingUser}</span>
              <span className="online-status">
                <span className="online-dot"></span>
              </span>
            </div>
            <div className="message-bubble typing-bubble">
              <span className="message-content">Typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          className="message-input"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleTyping}
          required
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
