import React, { useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import CareerVaultGate from './CareerVaultGate.jsx';

export const VaultContext = createContext();

export const useVault = () => useContext(VaultContext);

export default function CareerVaultLayout() {
  const [isLocked, setIsLocked] = useState(false);

  if (isLocked) {
    return <CareerVaultGate onUnlock={() => setIsLocked(false)} />;
  }

  return (
    <VaultContext.Provider value={{ setIsLocked }}>
      <Outlet />
    </VaultContext.Provider>
  );
}
