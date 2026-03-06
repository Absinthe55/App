import React, { useState } from 'react';

interface TaskCardProps {
  key?: React.Key;
  task: any;
  role: 'supervisor' | 'worker';
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string, imageUrl?: string) => void;
  onImageClick: (url: string) => void;
}

export default function TaskCard({ task, role, onDelete, onStatusChange, onImageClick }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [completedImage, setCompletedImage] = useState<File | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  const time = new Date(task.timestamp).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' });
  
  const statusMap: any = {
    pending: { icon: 'schedule', text: 'Bekliyor', cls: 'pending' },
    progress: { icon: 'engineering', text: 'Devam Ediyor', cls: 'progress' },
    completed: { icon: 'check_circle', text: 'Tamamlandı', cls: 'completed' }
  };
  const s = statusMap[task.status] || statusMap.pending;

  const handleToggle = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    setExpanded(!expanded);
    if (!expanded && role === 'worker' && task.status === 'pending' && !task.seenAt && onStatusChange) {
      onStatusChange(task.id, 'seen');
    }
  };

  const handleComplete = async () => {
    if (!onStatusChange) return;
    setIsCompleting(true);
    let imageUrl;
    if (completedImage) {
      const { compressImage } = await import('../utils/imageUtils');
      try {
        imageUrl = await compressImage(completedImage);
      } catch (e) {
        console.error(e);
      }
    }
    onStatusChange(task.id, 'completed', imageUrl);
    setIsCompleting(false);
  };

  return (
    <div className={`task-card priority-${task.priority} ${expanded ? 'expanded' : ''}`} onClick={handleToggle}>
      <div className="task-header">
        <div className="task-title">{task.title}</div>
        <div className="task-time">{time}</div>
      </div>
      <div className="task-chips">
        <span className={`chip chip-${s.cls}`}><span className="material-icons-round">{s.icon}</span> {s.text}</span>
        {role === 'supervisor' && <span className="chip chip-muted"><span className="material-icons-round">person</span> {task.worker}</span>}
        {role === 'supervisor' && (
          task.seenAt ? (
            <span className="chip chip-blue"><span className="material-icons-round">done_all</span> {new Date(task.seenAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
          ) : (
            <span className="chip chip-muted"><span className="material-icons-round">check</span> İletildi</span>
          )
        )}
      </div>
      
      {task.imageUrl && (
        <div className="task-img-wrap">
          <img src={task.imageUrl} loading="lazy" onClick={(e) => { e.stopPropagation(); onImageClick(task.imageUrl); }} />
        </div>
      )}
      
      {task.completedImageUrl && (
        <div className="task-img-wrap completed-img">
          <div className="img-label"><span className="material-icons-round">done_all</span> Tamamlandı</div>
          <img src={task.completedImageUrl} loading="lazy" onClick={(e) => { e.stopPropagation(); onImageClick(task.completedImageUrl); }} />
        </div>
      )}

      {task.materialRequest && (
        <div className="material-alert" onClick={(e) => e.stopPropagation()}>
          <span className="material-icons-round">warning_amber</span> <strong>Eksik Malzeme:</strong> {task.materialRequest}
        </div>
      )}

      {role === 'supervisor' && (
        <div className="task-actions" onClick={(e) => e.stopPropagation()}>
          <button className="action-btn danger" onClick={() => onDelete && onDelete(task.id)}>
            <span className="material-icons-round">delete</span> Sil
          </button>
        </div>
      )}

      {role === 'worker' && task.status === 'pending' && (
        <div className="task-actions" onClick={(e) => e.stopPropagation()}>
          <button className="action-btn success" onClick={() => onStatusChange && onStatusChange(task.id, 'progress')}>
            <span className="material-icons-round">play_arrow</span> Başla
          </button>
        </div>
      )}

      {role === 'worker' && task.status === 'progress' && (
        <div onClick={(e) => e.stopPropagation()}>
          <div className="file-upload-group" style={{ marginTop: '.8rem' }}>
            <input type="file" id={`ci-${task.id}`} accept="image/*" className="file-input" onChange={(e) => setCompletedImage(e.target.files?.[0] || null)} />
            <label htmlFor={`ci-${task.id}`} className="file-label" style={{ fontSize: '.85rem', padding: '.5rem' }}>
              <span className="material-icons-round">add_a_photo</span>
              <span>{completedImage ? completedImage.name : 'Tamamlanan Fotoğrafı (Ops.)'}</span>
            </label>
            {completedImage && <img src={URL.createObjectURL(completedImage)} className="image-preview" style={{ maxHeight: '100px' }} />}
          </div>
          <div className="task-actions">
            <button className="action-btn success" onClick={handleComplete} disabled={isCompleting}>
              {isCompleting ? <span className="material-icons-round spinning">sync</span> : <span className="material-icons-round">done_all</span>} Tamamla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
