import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import SupervisorScreen from './components/SupervisorScreen';
import WorkerScreen from './components/WorkerScreen';
import RadioPanel from './components/RadioPanel';
import Toast from './components/Toast';
import ImageModal from './components/ImageModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('titan_user'));
  const [currentRole, setCurrentRole] = useState<string | null>(localStorage.getItem('titan_role'));
  const [toast, setToast] = useState<{ message: string, icon: string } | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isRadioOpen, setIsRadioOpen] = useState(false);

  const showToast = (message: string, icon: string = 'info') => {
    setToast({ message, icon });
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogin = (username: string, role: string) => {
    setCurrentUser(username);
    setCurrentRole(role);
    localStorage.setItem('titan_user', username);
    localStorage.setItem('titan_role', role);
    showToast(`Hoş geldin, ${username}!`, 'waving_hand');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentRole(null);
    localStorage.removeItem('titan_user');
    localStorage.removeItem('titan_role');
    showToast('Çıkış yapıldı', 'logout');
  };

  return (
    <>
      <div className="background">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <RadioPanel isOpen={isRadioOpen} onClose={() => setIsRadioOpen(false)} />
      
      {toast && <Toast message={toast.message} icon={toast.icon} />}
      <ImageModal url={modalImage} onClose={() => setModalImage(null)} />

      {!currentUser ? (
        <LoginScreen onLogin={handleLogin} showToast={showToast} />
      ) : currentRole === 'supervisor' ? (
        <SupervisorScreen 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onToggleRadio={() => setIsRadioOpen(!isRadioOpen)} 
          showToast={showToast}
          onImageClick={setModalImage}
        />
      ) : (
        <WorkerScreen 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onToggleRadio={() => setIsRadioOpen(!isRadioOpen)} 
          showToast={showToast}
          onImageClick={setModalImage}
        />
      )}
    </>
  );
}
