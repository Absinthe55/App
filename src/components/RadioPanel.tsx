import React, { useState, useRef, useEffect } from 'react';

interface RadioPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RadioPanel({ isOpen, onClose }: RadioPanelProps) {
  const [station, setStation] = useState('https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio');
  const [volume, setVolume] = useState(70);
  const [status, setStatus] = useState('Radyo kapalı.');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node) && !(event.target as Element).closest('.radio-toggle-btn')) {
        onClose();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [onClose]);

  const playRadio = () => {
    if (audioRef.current) {
      if (audioRef.current.src !== station) audioRef.current.src = station;
      if (audioRef.current.paused) {
        setStatus('Bağlanıyor...');
        setIsPlaying(true);
        audioRef.current.play().then(() => {
          setStatus('Canlı Radyo Devrede');
        }).catch(() => {
          setStatus('Bağlantı hatası!');
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
        setStatus('Duraklatıldı.');
        setIsPlaying(false);
      }
    }
  };

  const stopRadio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setStatus('Radyo kapalı.');
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val / 100;
  };

  return (
    <div ref={panelRef} className={`header-radio-panel ${isOpen ? 'open' : ''}`}>
      <select className="radio-select" value={station} onChange={(e) => setStation(e.target.value)}>
        <option value="https://listen.powerapp.com.tr/powerturk/mpeg/icecast.audio">🎧 PowerTürk</option>
        <option value="https://listen.powerapp.com.tr/powerpop/mpeg/icecast.audio">🎧 Power Pop</option>
        <option value="https://radios.trt.net.tr/trtfm">🎧 TRT FM</option>
        <option value="https://listen.powerapp.com.tr/powerapparabesk/mpeg/icecast.audio">🎧 Power Arabesk</option>
        <option value="https://yayin.kralfm.com.tr/kralfm/mp3/icecast.audio">🎧 Kral FM</option>
      </select>
      <div className="radio-inline-controls">
        <button className="btn yt-btn play" onClick={playRadio}>
          <span className="material-icons-round">{isPlaying ? 'pause' : 'play_arrow'}</span> Dinle
        </button>
        <button className="btn yt-btn stop" onClick={stopRadio}>
          <span className="material-icons-round">stop</span> Kapat
        </button>
        <div className="radio-volume">
          <span className="material-icons-round">volume_up</span>
          <input type="range" min="0" max="100" value={volume} onChange={handleVolumeChange} />
        </div>
      </div>
      <div className="yt-status">{status}</div>
      <audio ref={audioRef} preload="none"></audio>
    </div>
  );
}
