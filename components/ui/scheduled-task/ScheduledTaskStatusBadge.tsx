import { ScheduledTaskStatus, TASK_STATUS_CONFIG } from "@/types/scheduler";
import { Badge } from "@chakra-ui/react/badge";

interface IProps {
  status: ScheduledTaskStatus;
}

export default function ScheduledTaskStatusBadge({ status }: IProps) {
  const config = TASK_STATUS_CONFIG[status];
  return (
    <Badge colorPalette={config.color} variant={config.variant} size="sm" borderRadius="md">
      {config.label}
    </Badge>
  );
}
