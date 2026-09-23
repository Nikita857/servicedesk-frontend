import type { MaintenanceSettings, MaintenanceStatus, UpdateMaintenanceRequest } from '@/types/maintenance';
import { getServiceDeskAPI } from './generated/client';

const generated = getServiceDeskAPI();

export const maintenanceApi = {
  getStatus: async (): Promise<MaintenanceStatus> => (await generated.getStatus2()).data as MaintenanceStatus,
  getSettings: async (): Promise<MaintenanceSettings> => (await generated.getStatus()).data as MaintenanceSettings,
  update: async (d: UpdateMaintenanceRequest): Promise<MaintenanceSettings> => (await generated.updateSettings1(d)).data as MaintenanceSettings,
};
