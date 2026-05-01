import { createContext, useContext } from 'react';
import type { LicenseTier } from '../types';

interface LicenseContextType {
  licenseValid: boolean;
  licenseTier: LicenseTier | null;
  refreshLicense: () => Promise<void>;
}

export const LicenseContext = createContext<LicenseContextType>({ licenseValid: false, licenseTier: null, refreshLicense: async () => {} });

export function useLicense() {
  return useContext(LicenseContext);
}
