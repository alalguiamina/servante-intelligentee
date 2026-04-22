import './i18n';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ChatbotWidget from './components/chatbot/ChatbotWidget';
import './index.css';

// Suppress non-critical unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason);
  
  // Suppress known harmless errors from third-party libraries
  const suppressed = [
    'No Listener: tabs:outgoing.message.ready',
    'No elements found',
    'Failed to connect to chromadb',
  ];
  
  if (suppressed.some(msg => message.includes(msg))) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ChatbotWidget />
  </React.StrictMode>,
);
