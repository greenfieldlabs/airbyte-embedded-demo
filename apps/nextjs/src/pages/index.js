import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ThemeToggle from '../components/ThemeToggle';
import LogoutToggle from '../components/LogoutToggle';
import PasswordForm from '../components/PasswordForm';
import UserForm from '../components/UserForm';
import UserInfo from '../components/UserInfo';
import Toast from '../components/Toast';
import apiClient from '../lib/apiClient';

export default function Home() {
  const [theme, setTheme] = useState('dark');
  const [isPasswordAuthenticated, setIsPasswordAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  // Apply theme to body on mount and theme change
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }
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
      if (typeof document !== 'undefined') {
        document.cookie = 'appPassword=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
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
      const allowedOrigin = typeof window !== 'undefined' ? window.location.origin : null;
      const { data } = await apiClient.getAirbyteToken(allowedOrigin);
      
      if (typeof window !== 'undefined' && window.AirbyteEmbeddedWidget) {
        const widget = new window.AirbyteEmbeddedWidget({
          token: data.token
        });
        widget.open();
      } else {
        throw new Error('Airbyte Embedded Widget not loaded');
      }
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
          <Image 
            src="/octavia-sonar.png" 
            alt="Octavia Sonar" 
            width={120}
            height={120}
            className="logo" 
            style={{ margin: '0 auto 1rem auto', display: 'block' }}
          />
        )}
        <h1>
          Embedded Demo
          <br/>
          <small style={{fontSize: '0.5em', fontWeight: 'normal', color: 'var(--text-secondary)'}}>
            Next.js Demo
          </small>
        </h1>
        
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