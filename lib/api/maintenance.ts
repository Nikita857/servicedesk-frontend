import {
  MaintenanceSettings,
  MaintenanceStatus,
  UpdateMaintenanceRequest,
} from "@/types/maintenance";
import api from "./client";

export const maintenanceApi = {
  getStatus: async (): Promise<MaintenanceStatus> =>
    (await api.get("/maintenance")).data.data,

  getSettings: async (): Promise<MaintenanceSettings> =>
    (await api.get("/admin/maintenance")).data.data,

  update: async (d: UpdateMaintenanceRequest): Promise<MaintenanceSettings> =>
    (await api.put("/admin/maintenance", d)).data.data,
};
