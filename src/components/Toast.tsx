import React from 'react';

interface ToastProps {
  message: string;
  icon?: string;
}

export default function Toast({ message, icon = 'info' }: ToastProps) {
  return (
    <div className="toast-container">
      <div className="toast">
        <span className="material-icons-round">{icon}</span> {message}
      </div>
    </div>
  );
}
