import { ScheduledTaskStatus } from "@/types/scheduler";
import { Badge } from "@chakra-ui/react/badge";

interface IProps {
  status: ScheduledTaskStatus;
}

export default function ScheduledTaskStatusBadge({ status }: IProps) {
  let color = "";
  let label = "";

  switch (status) {
    case "SCHEDULED":
      color = "blue";
      label = "Запланировано";
      break;
    case "EXECUTED":
      color = "green";
      label = "Выполнено";
      break;
    case "CANCELLED":
      color = "gray";
      label = "Отменено";
      break;
  }
  return (
    <Badge colorPalette={color} variant="subtle" size="sm" borderRadius="md">
      {label}
    </Badge>
  );
}
