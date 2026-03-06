import React, { useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCollection } from '../hooks/useCollection';
import TaskCard from './TaskCard';
import { compressImage } from '../utils/imageUtils';

interface SupervisorScreenProps {
  currentUser: string;
  onLogout: () => void;
  onToggleRadio: () => void;
  showToast: (msg: string, icon?: string) => void;
  onImageClick: (url: string) => void;
}

export default function SupervisorScreen({ currentUser, onLogout, onToggleRadio, showToast, onImageClick }: SupervisorScreenProps) {
  const [activeTab, setActiveTab] = useState('tasks');
  const [taskFilter, setTaskFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const tasks = useCollection('tasks');
  const leaves = useCollection('leaves');
  const materials = useCollection('materials');
  const documents = useCollection('documents');
  const users = useCollection('users');

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const progressCount = tasks.filter(t => t.status === 'progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const handleAddTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const worker = (form.elements.namedItem('worker') as HTMLSelectElement).value;
    const priority = (form.elements.namedItem('priority') as RadioNodeList).value;
    const fileInput = form.elements.namedItem('image') as HTMLInputElement;
    const file = fileInput.files?.[0];

    setIsSubmitting(true);
    let imageUrl = null;
    if (file) {
      try {
        imageUrl = await compressImage(file);
      } catch (err) {
        showToast('Resim işlenemedi.', 'error');
      }
    }

    try {
      await addDoc(collection(db, 'tasks'), {
        title, worker, priority, status: 'pending',
        timestamp: new Date().toISOString(),
        imageUrl, completedImageUrl: null
      });
      showToast('Görev başarıyla atandı!', 'task_alt');
      form.reset();
    } catch (err) {
      showToast('Görev eklenirken hata oluştu!', 'error');
    }
    setIsSubmitting(false);
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm("Bu görevi silmek istediğinize emin misiniz?")) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        showToast('Görev silindi.', 'delete');
      } catch (err) {
        showToast('Silinemedi!', 'error');
      }
    }
  };

  const filteredTasks = taskFilter === 'all' ? tasks : tasks.filter(t => t.status === taskFilter);

  return (
    <main id="supervisor-screen" className="screen active">
      <header className="glass-header">
        <div className="header-info">
          <h2>Amir Paneli</h2>
          <p>Hoş geldin, <span className="current-user-name">{currentUser}</span></p>
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

      <div className="stats-bar">
        <div className="stat-chip pending"><span className="material-icons-round">schedule</span> <span>{pendingCount} Bekliyor</span></div>
        <div className="stat-chip progress"><span className="material-icons-round">engineering</span> <span>{progressCount} Devam</span></div>
        <div className="stat-chip completed"><span className="material-icons-round">check_circle</span> <span>{completedCount} Bitti</span></div>
      </div>

      <div className="content-area">
        {activeTab === 'tasks' && (
          <div className="tab-content active">
            <section className="add-task-section glass-panel">
              <h3><span className="material-icons-round">add_task</span> Yeni Görev Ver</h3>
              <form onSubmit={handleAddTask}>
                <div className="input-group dark">
                  <span className="material-icons-round">assignment</span>
                  <input type="text" name="title" placeholder="Görev başlığı / tanımı" required />
                </div>
                <div className="input-group dark">
                  <span className="material-icons-round">engineering</span>
                  <select name="worker" required defaultValue="">
                    <option value="" disabled>Usta Seçin</option>
                    {users.filter(u => u.role === 'worker').map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="priority-selector">
                  <span>Öncelik:</span>
                  <label><input type="radio" name="priority" value="low" /> Düşük</label>
                  <label><input type="radio" name="priority" value="medium" defaultChecked /> Normal</label>
                  <label><input type="radio" name="priority" value="high" /> Acil</label>
                </div>
                <div className="file-upload-group">
                  <input type="file" name="image" id="task-image" accept="image/*" className="file-input" />
                  <label htmlFor="task-image" className="file-label">
                    <span className="material-icons-round">add_a_photo</span>
                    <span>Fotoğraf Ekle (Opsiyonel)</span>
                  </label>
                </div>
                <button type="submit" className="btn primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? <span className="material-icons-round spinning">sync</span> : <span className="material-icons-round">send</span>} Görevi Ata
                </button>
              </form>
            </section>

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
                  <TaskCard key={task.id} task={task} role="supervisor" onDelete={handleDeleteTask} onImageClick={onImageClick} />
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'calendar' && (
          <div className="tab-content active">
            <section className="glass-panel">
              <h3><span className="material-icons-round">event</span> İzin Talepleri</h3>
              <div className="task-container">
                {leaves.length === 0 ? (
                  <div className="empty-state">Henüz izin talebi yok.</div>
                ) : (
                  leaves.map(lv => {
                    const sd = new Date(lv.start).toLocaleDateString('tr-TR');
                    const ed = new Date(lv.end).toLocaleDateString('tr-TR');
                    const statusMap: any = {
                      pending: { cls: 'pending', label: 'Bekliyor' },
                      approved: { cls: 'completed', label: 'Onaylandı' },
                      rejected: { cls: 'urgent', label: 'Reddedildi' },
                      cancelled: { cls: 'danger', label: 'İptal Edildi' }
                    };
                    const st = statusMap[lv.status] || statusMap.pending;
                    
                    return (
                      <div key={lv.id} className="task-card">
                        <div className="task-header">
                          <div className="task-title"><span className="material-icons-round" style={{fontSize:'1rem',verticalAlign:'middle'}}>person</span> {lv.worker}</div>
                        </div>
                        <div className="task-chips">
                          <span className="chip chip-muted"><span className="material-icons-round">date_range</span> {sd} → {ed}</span>
                          <span className={`chip chip-${st.cls}`}>{st.label}</span>
                        </div>
                        <div className="task-actions" style={{gap:'.5rem',marginTop:'.8rem'}}>
                          {lv.status === 'pending' && (
                            <>
                              <button className="action-btn success" onClick={() => updateDoc(doc(db, 'leaves', lv.id), { status: 'approved' })}>
                                <span className="material-icons-round">thumb_up</span> Onayla
                              </button>
                              <button className="action-btn danger" onClick={() => updateDoc(doc(db, 'leaves', lv.id), { status: 'rejected' })}>
                                <span className="material-icons-round">thumb_down</span> Reddet
                              </button>
                            </>
                          )}
                          {lv.status === 'approved' && (
                            <button className="action-btn danger" onClick={() => updateDoc(doc(db, 'leaves', lv.id), { status: 'cancelled' })}>
                              <span className="material-icons-round">cancel</span> İptal Et
                            </button>
                          )}
                          <button className="action-btn danger" onClick={() => { if(window.confirm('Emin misiniz?')) deleteDoc(doc(db, 'leaves', lv.id)) }}>
                            <span className="material-icons-round">delete</span> Sil
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
              <h3><span className="material-icons-round">inventory_2</span> Eksik Malzeme Talepleri</h3>
              <div className="task-container">
                {materials.length === 0 ? (
                  <div className="empty-state">Malzeme talebi yok.</div>
                ) : (
                  materials.map(m => {
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
                          <div className="task-title"><span className="material-icons-round" style={{fontSize:'1rem',verticalAlign:'middle'}}>inventory_2</span> {m.name}</div>
                          <div className="task-time">{time}</div>
                        </div>
                        <div className="task-chips">
                          <span className="chip chip-muted"><span className="material-icons-round">person</span> {m.worker}</span>
                          <span className={`chip chip-${st.cls}`}>{st.label}</span>
                        </div>
                        {m.desc && <p className="mat-desc">{m.desc}</p>}
                        {m.imageUrl && (
                          <div className="task-img-wrap">
                            <img src={m.imageUrl} loading="lazy" onClick={(e) => { e.stopPropagation(); onImageClick(m.imageUrl); }} />
                          </div>
                        )}
                        <div className="task-actions" style={{marginTop:'.5rem'}}>
                          {m.status === 'pending' && (
                            <>
                              <button className="action-btn success" onClick={() => updateDoc(doc(db, 'materials', m.id), { status: 'approved', resolvedAt: new Date().toISOString() })}>
                                <span className="material-icons-round">check_circle</span> Onayla
                              </button>
                              <button className="action-btn danger" onClick={() => updateDoc(doc(db, 'materials', m.id), { status: 'rejected', resolvedAt: new Date().toISOString() })}>
                                <span className="material-icons-round">cancel</span> Reddet
                              </button>
                            </>
                          )}
                          <button className="action-btn danger" onClick={() => { if(window.confirm('Emin misiniz?')) deleteDoc(doc(db, 'materials', m.id)) }}>
                            <span className="material-icons-round">delete</span> Sil
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

        {activeTab === 'docs' && (
          <div className="tab-content active">
            <section className="glass-panel">
              <h3><span className="material-icons-round">folder</span> Döküman Yönetimi</h3>
              <form style={{marginBottom:'1rem'}} onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const fileInput = form.elements.namedItem('file') as HTMLInputElement;
                const file = fileInput.files?.[0];
                if (!title || !file) return;

                setIsSubmitting(true);
                try {
                  let downloadUrls: string[] = [];
                  if (file.type === 'application/pdf') {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await (window as any).pdfjsLib.getDocument(arrayBuffer).promise;
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                      const page = await pdf.getPage(pageNum);
                      const viewport = page.getViewport({ scale: 1.0 });
                      const canvas = document.createElement('canvas');
                      const ctx = canvas.getContext('2d');
                      canvas.height = viewport.height;
                      canvas.width = viewport.width;
                      await page.render({ canvasContext: ctx, viewport }).promise;
                      downloadUrls.push(canvas.toDataURL('image/jpeg', 0.50));
                    }
                  } else {
                    downloadUrls.push(await compressImage(file, 1000));
                  }
                  
                  await addDoc(collection(db, 'documents'), {
                    title, urls: downloadUrls, uploader: currentUser, timestamp: new Date().toISOString()
                  });
                  showToast('Döküman yüklendi.', 'cloud_done');
                  form.reset();
                } catch (err) {
                  showToast('Döküman yüklenemedi.', 'error');
                }
                setIsSubmitting(false);
              }}>
                <div className="input-group dark">
                  <span className="material-icons-round">title</span>
                  <input type="text" name="title" placeholder="Döküman Adı/Başlığı" required />
                </div>
                <div className="file-upload-group">
                  <input type="file" name="file" id="doc-file" accept=".pdf,.png,.jpg,.jpeg" className="file-input" required />
                  <label htmlFor="doc-file" className="file-label" style={{justifyContent:'center'}}>
                    <span className="material-icons-round">upload_file</span>
                    <span>Dosya Seç (Sadece PDF, PNG, JPG)</span>
                  </label>
                </div>
                <button type="submit" className="btn primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? <span className="material-icons-round spinning">sync</span> : <span className="material-icons-round">cloud_upload</span>} Dökümanı Yükle
                </button>
              </form>

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
                      <div className="task-actions" style={{marginTop:'1rem'}}>
                        <button className="action-btn danger" onClick={() => { if(window.confirm('Emin misiniz?')) deleteDoc(doc(db, 'documents', d.id)) }}>
                          <span className="material-icons-round">delete</span> Sil
                        </button>
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

        {/* Other tabs will be implemented similarly */}
        {activeTab === 'profile' && (
          <div className="tab-content active">
            <section className="user-management-section glass-panel">
              <h3><span className="material-icons-round">manage_accounts</span> Ekip Yönetimi</h3>
              <p className="section-desc">Sisteme giriş yapabilen personelleri ve şifrelerini yönetin.</p>
              <div className="task-container" style={{marginBottom:'1rem'}}>
                {users.map(u => (
                  <div key={u.id} className="task-card" style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'.9rem',marginBottom:'.5rem'}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:'1rem'}}>{u.name}</div>
                      <div style={{marginTop:'.3rem',fontSize:'.82rem',color:'var(--clr-text-muted)',display:'flex',alignItems:'center',gap:'.4rem'}}>
                        <span className="material-icons-round" style={{fontSize:'.9rem'}}>{u.role === 'supervisor' ? 'admin_panel_settings' : 'engineering'}</span> {u.role === 'supervisor' ? 'Amir' : 'Usta'}
                        &nbsp;|&nbsp; Şifre:
                        <span style={{fontFamily:'monospace',background:'rgba(255,255,255,.08)',padding:'.1rem .4rem',borderRadius:'4px'}}>{u.password}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      <nav className="bottom-nav">
        <a className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
          <span className="material-icons-round">assignment</span><span>Görevler</span>
        </a>
        <a className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <span className="material-icons-round">event</span><span>İzinler</span>
        </a>
        <a className={`nav-item ${activeTab === 'materials' ? 'active' : ''}`} onClick={() => setActiveTab('materials')}>
          <span className="material-icons-round">inventory_2</span><span>Malzeme</span>
        </a>
        <a className={`nav-item ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
          <span className="material-icons-round">folder</span><span>Dökümanlar</span>
        </a>
        <a className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <span className="material-icons-round">people</span><span>Ekip</span>
        </a>
      </nav>
    </main>
  );
}
