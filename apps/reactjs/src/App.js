import React, { useState, useEffect } from 'react';
import ThemeToggle from './components/ThemeToggle';
import LogoutToggle from './components/LogoutToggle';
import PasswordForm from './components/PasswordForm';
import UserForm from './components/UserForm';
import UserInfo from './components/UserInfo';
import Toast from './components/Toast';
import apiClient from './api/client';

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [isPasswordAuthenticated, setIsPasswordAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  // Apply theme to body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Check authentication on mount
  useEffect(() => {
    checkExistingAuth();
  }, []);


  const checkExistingAuth = async () => {
    try {
      const { data } = await apiClient.getCurrentUser();
      setIsPasswordAuthenticated(true);
      setCurrentUser(data.email);
    } catch (error) {
      if (error.message.includes('401')) {
        if (!error.message.includes('Password required')) {
          setIsPasswordAuthenticated(true);
        }
      }
      console.error('Error checking authentication status:', error);
    }
  };

  const showToast = (message, isError = false) => {
    setToast({ message, type: isError ? 'error' : 'success', visible: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handlePasswordAuth = async (password) => {
    try {
      await apiClient.login(password);
      setIsPasswordAuthenticated(true);
      showToast('Access granted!');
      checkExistingAuth();
      return true;
    } catch (error) {
      showToast(error.message || 'Invalid password', true);
      return false;
    }
  };

  const handleUserAuth = async (email, workspaceName) => {
    try {
      const { status } = await apiClient.createOrLoginUser(email, workspaceName);
      setCurrentUser(email);
      showToast(status === 201 ? 'User created and logged in successfully!' : 'Login successful!');
      return true;
    } catch (error) {
      showToast(error.message || 'Failed to process request', true);
      return false;
    }
  };

  const handleUserLogout = async () => {
    try {
      await apiClient.logout();
      setCurrentUser(null);
      showToast('User logged out successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      showToast('Error during logout', true);
    }
  };

  const handleAppLogout = async () => {
    try {
      await apiClient.logout();
      document.cookie = 'appPassword=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      setCurrentUser(null);
      setIsPasswordAuthenticated(false);
      showToast('Logged out from application');
    } catch (error) {
      console.error('Error during app logout:', error);
      showToast('Error during logout', true);
    }
  };

  const handleConnectData = async () => {
    try {
      const { data } = await apiClient.getAirbyteToken(window.location.origin);
      
      const widget = new window.AirbyteEmbeddedWidget({
        token: data.token
      });
      widget.open();
    } catch (error) {
      console.error('Error connecting data:', error);
      showToast('Error connecting data', true);
    }
  };

  return (
    <>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      {isPasswordAuthenticated && (
        <LogoutToggle onLogout={handleAppLogout} />
      )}
      
      <div className="container">
        {(!currentUser) && (
          <img 
            src="/octavia-sonar.png" 
            alt="Octavia Sonar" 
            className="logo" 
          />
        )}
        <h1>Embedded Demo<br/><small style={{fontSize: '0.5em', fontWeight: 'normal', color: 'var(--text-secondary)'}}>React Demo</small></h1>
        
        {!isPasswordAuthenticated ? (
          <PasswordForm onSubmit={handlePasswordAuth} />
        ) : !currentUser ? (
          <UserForm onSubmit={handleUserAuth} />
        ) : (
          <UserInfo 
            user={currentUser} 
            onLogout={handleUserLogout}
            onConnectData={handleConnectData}
          />
        )}
        
        {currentUser && (
          <p className="airbyte-hint">
            Click "Connect Data" to open the Airbyte Embedded widget
          </p>
        )}
      </div>
      
      <Toast 
        message={toast.message} 
        type={toast.type} 
        visible={toast.visible} 
      />
    </>
  );
}

export default App;