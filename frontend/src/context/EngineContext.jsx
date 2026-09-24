import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config';
import RunLocalModal from '../components/RunLocalModal';

const EngineContext = createContext({
  layaAvailable: true,
  isCloud: false,
  engineInfo: null,
  openDownloadModal: () => {},
  closeDownloadModal: () => {},
});

export function EngineProvider({ children }) {
  const [engineInfo, setEngineInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/engine-info`)
      .then(res => res.json())
      .then(data => {
        if (data) setEngineInfo(data);
      })
      .catch(() => {
        // Fallback: if backend fails or doesn't have endpoint
      });
  }, []);

  const isLocalHost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // If backend explicitly reports laya_available === false, or if we are deployed on live web host
  // and backend reports cloud/unavailable:
  const layaAvailable = Boolean(engineInfo ? engineInfo.laya_available : isLocalHost);
  const isCloud = Boolean(engineInfo?.is_cloud || !isLocalHost || !layaAvailable);

  const openDownloadModal = () => setIsModalOpen(true);
  const closeDownloadModal = () => setIsModalOpen(false);

  return (
    <EngineContext.Provider value={{
      layaAvailable,
      isCloud,
      engineInfo,
      openDownloadModal,
      closeDownloadModal,
    }}>
      {children}
      <RunLocalModal isOpen={isModalOpen} onClose={closeDownloadModal} />
    </EngineContext.Provider>
  );
}

export function useEngine() {
  return useContext(EngineContext);
}
