import React, { useEffect } from 'react';

interface ImageModalProps {
  url: string | null;
  onClose: () => void;
}

export default function ImageModal({ url, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!url) return null;

  return (
    <div className="image-modal open" onClick={onClose}>
      <button className="image-modal-close" onClick={onClose}>
        <span className="material-icons-round">close</span>
      </button>
      <img src={url} alt="Büyük Resim" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
