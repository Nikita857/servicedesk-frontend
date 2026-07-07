import MaintenanceScreen from "@/components/features/maintenance/MaintenanceScreen";

// Статический fallback по прямому URL /maintenance.
// Основной режим обслуживания управляется MaintenanceGate (рантайм-флаг с бэка),
// который сам рендерит экран на любом маршруте — редиректа сюда больше нет.
export default function MaintenancePage() {
  return <MaintenanceScreen endsAt={null} />;
}
