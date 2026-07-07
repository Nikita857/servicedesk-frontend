export interface MaintenanceStatus {
  active: boolean;
  message: string | null;
  endsAt: string | null;
  serverTime: string;
}

export interface MaintenanceSettings {
  enabled: boolean;
  message: string | null;
  endsAt: string | null;
  updatedAt: string;
}

export interface UpdateMaintenanceRequest {
  enabled: boolean;
  message?: string | null;
  endsAt?: string | null;
}
