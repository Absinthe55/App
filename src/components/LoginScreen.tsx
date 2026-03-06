import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LoginScreenProps {
  onLogin: (username: string, role: string) => void;
  showToast: (msg: string, icon?: string) => void;
}

export default function LoginScreen({ onLogin, showToast }: LoginScreenProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const systemUsers: any[] = [];
      const seenNames = new Set();

      querySnapshot.forEach((d) => {
        const userData = d.data();
        if (seenNames.has(userData.name)) {
          deleteDoc(doc(db, "users", d.id)).catch(() => { });
          return;
        }
        seenNames.add(userData.name);
        systemUsers.push({ id: d.id, ...userData });
      });

      if (systemUsers.length === 0) {
        await addDoc(collection(db, "users"), { name: "Erkan Çilingir", role: "supervisor", password: "123" });
        await addDoc(collection(db, "users"), { name: "Berat Özker", role: "worker", password: "123" });
        return fetchUsers();
      }

      setUsers(systemUsers);
      setLoading(false);
    } catch (e: any) {
      console.error("fetchUsers error:", e);
      setLoading(false);
      showToast(`Bağlantı Hatası: ${e.message}`, 'error');
    }
  };

  const handleSelectUser = (userName: string) => {
    setSelectedUser(userName);
    const rememberedPass = localStorage.getItem(`remember_${userName}`);
    if (rememberedPass) {
      setPassword(rememberedPass);
      setRememberMe(true);
    } else {
      setPassword('');
      setRememberMe(false);
    }
  };

  const handleLogin = () => {
    if (!password) {
      showToast('Lütfen şifrenizi girin.', 'lock');
      return;
    }

    setIsLoggingIn(true);
    const user = users.find(u => u.name === selectedUser);
    
    if (user && user.password === password) {
      if (rememberMe) {
        localStorage.setItem(`remember_${user.name}`, password);
      } else {
        localStorage.removeItem(`remember_${user.name}`);
      }
      onLogin(user.name, user.role);
    } else {
      showToast('Hatalı şifre girdiniz.', 'lock');
      setIsLoggingIn(false);
    }
  };

  return (
    <main id="login-screen" className="screen active">
      <div className="glass-card login-card">
        <div className="logo-container">
          <div className="logo-icon-wrap">
            <span className="material-icons-round" style={{fontSize: '3rem', color: 'var(--clr-primary)'}}>engineering</span>
          </div>
          <h1>TİTAN MAKİNA</h1>
          <p>Hidrolik Birimi Görev Yönetim Sistemi</p>
        </div>

        <p className="form-label">Hesabınızı seçin</p>
        <div className="login-options">
          {loading ? (
            <div className="login-card-user" style={{ justifyContent: 'center', color: 'var(--clr-text-muted)' }}>
              <span className="material-icons-round spinning">sync</span> Yükleniyor...
            </div>
          ) : (
            users.map(user => {
              const roleIcon = user.role === 'supervisor' ? 'admin_panel_settings' : 'engineering';
              const roleText = user.role === 'supervisor' ? 'Amir' : 'Usta';
              const isSelected = selectedUser === user.name;

              return (
                <div key={user.id} className={`login-card-group ${isSelected ? 'selected' : ''}`}>
                  <div className="login-card-user" onClick={() => handleSelectUser(user.name)}>
                    <div className="icon-box"><span className="material-icons-round">{roleIcon}</span></div>
                    <div className="user-info">
                      <span className="name">{user.name}</span>
                      <span className="role">{roleText}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="inline-password-form">
                      <div className="inline-input-row">
                        <input 
                          type="password" 
                          className="inline-password-input" 
                          placeholder="Şifreniz" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                        <button type="button" className="btn primary-btn inline-login-btn" onClick={handleLogin} disabled={isLoggingIn}>
                          {isLoggingIn ? (
                            <><span className="material-icons-round spinning" style={{ fontSize: '1rem', marginRight: '2px' }}>sync</span>...</>
                          ) : (
                            <>Giriş <span className="material-icons-round" style={{ fontSize: '1rem', marginLeft: '2px' }}>arrow_forward</span></>
                          )}
                        </button>
                      </div>
                      <label className="remember-me-label">
                        <input 
                          type="checkbox" 
                          className="remember-me-checkbox" 
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        /> Beni Hatırla
                      </label>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="hint">Hesabınızı seçin ve şifrenizi girin.</div>
      </div>
    </main>
  );
}
