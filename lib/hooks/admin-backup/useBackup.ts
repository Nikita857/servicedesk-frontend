import { adminApi } from "@/lib/api/admin";
import { handleApiError, toast } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

export function useBackup() {
  const runBackup = useMutation({
    mutationFn: () => adminApi.runBackup(),
    onSuccess: (result) => {
      if (result.minioOk == false || result.postgresOk == false) {
        toast.error(
          "Бэкап завершился неудачей",
          `MinIO: ${result.minioOk} PostgreSQL: ${result.postgresOk} timestamp: ${result.timestamp}`,
        );
      } else {
        toast.success(
          "Бэкап выполнен",
          `MinIO: ${result.minioOk} PostgreSQL: ${result.postgresOk} timestamp: ${result.timestamp}`,
        );
      }
    },
    onError: (error) => handleApiError(error, { context: "Записать бэкап" }),
  });

  return { runBackup };
}
