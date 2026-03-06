import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCollection } from '../hooks/useCollection';
import TaskCard from './TaskCard';

interface WorkerScreenProps {
  currentUser: string;
  onLogout: () => void;
  onToggleRadio: () => void;
  showToast: (msg: string, icon?: string) => void;
  onImageClick: (url: string) => void;
}

export default function WorkerScreen({ currentUser, onLogout, onToggleRadio, showToast, onImageClick }: WorkerScreenProps) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskFilter, setTaskFilter] = useState('all');
  
  const tasks = useCollection('tasks');
  const leaves = useCollection('leaves');
  const materials = useCollection('materials');
  const documents = useCollection('documents');

  const myTasks = tasks.filter(t => t.worker === currentUser);
  const filteredTasks = taskFilter === 'all' ? myTasks : myTasks.filter(t => t.status === taskFilter);

  const handleStatusChange = async (id: string, status: string, imageUrl?: string) => {
    try {
      if (status === 'seen') {
        await updateDoc(doc(db, 'tasks', id), { seenAt: new Date().toISOString() });
      } else if (status === 'completed') {
        const data: any = { status: 'completed' };
        if (imageUrl) data.completedImageUrl = imageUrl;
        await updateDoc(doc(db, 'tasks', id), data);
        showToast('Görev tamamlandı!', 'done_all');
      } else {
        await updateDoc(doc(db, 'tasks', id), { status });
        showToast('Görev başlatıldı', 'check');
      }
    } catch (err) {
      showToast('Durum güncellenemedi!', 'error');
    }
  };

  return (
    <main id="worker-screen" className="screen active">
      <header className="glass-header worker-header">
        <div className="header-info">
          <h2>Usta Paneli</h2>
          <p>Kolay gelsin, <span className="current-user-name">{currentUser}</span></p>
        </div>
        <div className="header-actions">
          <button className="icon-btn radio-toggle-btn" onClick={onToggleRadio} title="Radyo">
            <span className="material-icons-round">radio</span>
          </button>
          <button className="icon-btn logout-btn" onClick={onLogout} title="Çıkış Yap">
            <span className="material-icons-round">logout</span>
          </button>
        </div>
      </header>

      <div className="content-area">
        {activeTab === 'tasks' && (
          <div className="tab-content active">
            <div className="task-filter-tabs">
              <button className={`filter-tab ${taskFilter === 'all' ? 'active' : ''}`} onClick={() => setTaskFilter('all')}>Tümü</button>
              <button className={`filter-tab ${taskFilter === 'pending' ? 'active' : ''}`} onClick={() => setTaskFilter('pending')}>Bekliyor</button>
              <button className={`filter-tab ${taskFilter === 'progress' ? 'active' : ''}`} onClick={() => setTaskFilter('progress')}>Devam Ediyor</button>
              <button className={`filter-tab ${taskFilter === 'completed' ? 'active' : ''}`} onClick={() => setTaskFilter('completed')}>Tamamlandı</button>
            </div>

            <div className="task-container">
              {filteredTasks.length === 0 ? (
                <div className="empty-state"><span className="material-icons-round" style={{fontSize:'3rem',opacity:.3}}>assignment</span><p>Bu filtrede görev yok.</p></div>
              ) : (
                filteredTasks.map(task => (
                  <TaskCard key={task.id} task={task} role="worker" onStatusChange={handleStatusChange} onImageClick={onImageClick} />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="tab-content active">
            <section className="leave-request-section glass-panel">
              <h3><span className="material-icons-round">flight_takeoff</span> Yıllık İzin Talep Et</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const start = (form.elements.namedItem('start') as HTMLInputElement).value;
                const end = (form.elements.namedItem('end') as HTMLInputElement).value;
                if (!start || !end) return;

                try {
                  await addDoc(collection(db, 'leaves'), {
                    worker: currentUser, start, end, status: 'pending', timestamp: new Date().toISOString()
                  });
                  showToast('İzin talebi gönderildi.', 'event_available');
                  form.reset();
                } catch (err) {
                  showToast('İzin talebi gönderilemedi.', 'error');
                }
              }}>
                <label className="date-label">Başlangıç Tarihi</label>
                <div className="input-group dark">
                  <span className="material-icons-round">calendar_today</span>
                  <input type="date" name="start" required />
                </div>
                <label className="date-label">Bitiş Tarihi</label>
                <div className="input-group dark">
                  <span className="material-icons-round">event_busy</span>
                  <input type="date" name="end" required />
                </div>
                <button type="submit" className="btn secondary-btn">
                  <span className="material-icons-round">send</span> İzin Talebi Gönder
                </button>
              </form>
            </section>

            <section className="glass-panel" style={{marginTop:'1rem'}}>
              <h3><span className="material-icons-round">list_alt</span> İzinlerim / Taleplerim</h3>
              <div className="task-container">
                {leaves.filter(lv => lv.worker === currentUser).length === 0 ? (
                  <div className="empty-state">Henüz bir izin talebiniz bulunmuyor.</div>
                ) : (
                  leaves.filter(lv => lv.worker === currentUser).map(lv => {
                    const sd = new Date(lv.start).toLocaleDateString('tr-TR');
                    const ed = new Date(lv.end).toLocaleDateString('tr-TR');
                    const statusMap: any = {
                      pending: { cls: 'pending', label: 'Bekliyor' },
                      approved: { cls: 'completed', label: 'Onaylandı' },
                      rejected: { cls: 'urgent', label: 'Reddedildi' }
                    };
                    const st = statusMap[lv.status] || statusMap.pending;

                    return (
                      <div key={lv.id} className="task-card">
                        <div className="task-header">
                          <div className="task-title"><span className="material-icons-round" style={{fontSize:'1rem',verticalAlign:'middle'}}>event</span> İzin Talebim</div>
                        </div>
                        <div className="task-chips">
                          <span className="chip chip-muted"><span className="material-icons-round">date_range</span> {sd} → {ed}</span>
                          <span className={`chip chip-${st.cls}`}>{st.label}</span>
                        </div>
                        <div className="task-actions" style={{marginTop:'.8rem'}}>
                          <button className="action-btn danger" onClick={() => { if(window.confirm('Emin misiniz?')) deleteDoc(doc(db, 'leaves', lv.id)) }}>
                            <span className="material-icons-round">delete</span> İptal Et
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="tab-content active">
            <section className="glass-panel">
              <h3><span className="material-icons-round">inventory_2</span> Eksik Malzeme Bildir</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                const desc = (form.elements.namedItem('desc') as HTMLInputElement).value;
                const fileInput = form.elements.namedItem('image') as HTMLInputElement;
                const file = fileInput.files?.[0];
                if (!name) return;

                let imageUrl = null;
                if (file) {
                  const { compressImage } = await import('../utils/imageUtils');
                  try { imageUrl = await compressImage(file); } catch (err) { showToast('Resim işleme hatası!', 'error'); }
                }

                try {
                  await addDoc(collection(db, 'materials'), {
                    worker: currentUser, name, desc, imageUrl, status: 'pending', timestamp: new Date().toISOString()
                  });
                  showToast('Malzeme talebi gönderildi.', 'inventory_2');
                  form.reset();
                } catch (err) {
                  showToast('Talep gönderilemedi.', 'error');
                }
              }}>
                <div className="input-group dark">
                  <span className="material-icons-round">search</span>
                  <input type="text" name="name" placeholder="Eksik malzeme adı" required />
                </div>
                <div className="input-group dark">
                  <span className="material-icons-round">notes</span>
                  <input type="text" name="desc" placeholder="Açıklama (opsiyonel)" />
                </div>
                <div className="file-upload-group">
                  <input type="file" name="image" id="material-image" accept="image/*" className="file-input" />
                  <label htmlFor="material-image" className="file-label">
                    <span className="material-icons-round">add_a_photo</span>
                    <span>Fotoğraf Ekle (Opsiyonel)</span>
                  </label>
                </div>
                <button type="submit" className="btn primary-btn">
                  <span className="material-icons-round">send</span> Talep Gönder
                </button>
              </form>
            </section>

            <section className="glass-panel" style={{marginTop:'1rem'}}>
              <h3><span className="material-icons-round">list_alt</span> Taleplerim</h3>
              <div className="task-container">
                {materials.filter(m => m.worker === currentUser).length === 0 ? (
                  <div className="empty-state">Henüz malzeme talebiniz yok.</div>
                ) : (
                  materials.filter(m => m.worker === currentUser).map(m => {
                    const statusMap: any = {
                      pending: { cls: 'pending', label: 'Bekliyor' },
                      resolved: { cls: 'completed', label: 'Çözüldü' },
                      approved: { cls: 'completed', label: 'Onaylandı' },
                      rejected: { cls: 'danger', label: 'Reddedildi' }
                    };
                    const st = statusMap[m.status] || statusMap.pending;
                    const time = new Date(m.timestamp).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });

                    return (
                      <div key={m.id} className="task-card">
                        <div className="task-header">
                          <div className="task-title">{m.name}</div>
                          <div className="task-time">{time}</div>
                        </div>
                        <div className="task-chips">
                          <span className={`chip chip-${st.cls}`}>{st.label}</span>
                        </div>
                        {m.desc && <p className="mat-desc">{m.desc}</p>}
                        {m.imageUrl && (
                          <div className="task-img-wrap">
                            <img src={m.imageUrl} loading="lazy" onClick={(e) => { e.stopPropagation(); onImageClick(m.imageUrl); }} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="tab-content active">
            <section className="glass-panel">
              <h3><span className="material-icons-round">folder</span> Ortak Dökümanlar</h3>
              <div className="task-container">
                {documents.length === 0 ? (
                  <div className="empty-state">Henüz döküman yüklenmemiş.</div>
                ) : (
                  documents.map(d => (
                    <div key={d.id} className="task-card">
                      <div className="task-header">
                        <div className="task-title"><span className="material-icons-round" style={{fontSize:'1rem',verticalAlign:'middle',color:'var(--clr-primary)'}}>description</span> {d.title}</div>
                        <div className="task-time">{new Date(d.timestamp).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div className="task-chips">
                        <span className="chip chip-muted">Yükleyen: {d.uploader}</span>
                        <span className="chip chip-blue"><span className="material-icons-round">pages</span> {d.urls?.length || 1} Sayfa</span>
                      </div>
                      <div style={{marginTop:'1rem', borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'1rem'}}>
                        {(d.urls || [d.url]).map((url: string, i: number) => (
                          <div key={i} style={{marginBottom:'1rem', textAlign:'center'}}>
                            <div style={{fontSize:'0.8rem', color:'var(--clr-text-muted)', marginBottom:'4px'}}>Sayfa {i + 1}</div>
                            <img src={url} style={{maxWidth:'100%', borderRadius:'8px', cursor:'pointer', border:'1px solid rgba(255,255,255,0.1)'}} onClick={() => onImageClick(url)} loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <a className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          <span className="material-icons-round">assignment</span><span>Görevlerim</span>
        </a>
        <a className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <span className="material-icons-round">event</span><span>İzin Al</span>
        </a>
        <a className={`nav-item ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
          <span className="material-icons-round">inventory_2</span><span>Malzeme</span>
        </a>
        <a className={`nav-item ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
          <span className="material-icons-round">folder</span><span>Dökümanlar</span>
        </a>
      </nav>
    </main>
  );
}
