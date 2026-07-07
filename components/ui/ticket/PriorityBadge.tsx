import { Badge } from "@chakra-ui/react/badge";

interface IProps {
  color: string;
  label: string;
}
export default function PriorityBadge({ color, label }: IProps) {
  return (
    <Badge colorPalette={color} variant="subtle" size="sm" borderRadius="md">
      {label}
    </Badge>
  );
}
