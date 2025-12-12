import { toaster } from "@/components/ui/toaster";
import { ticketApi } from "@/lib/api";
import {
  statusTransitions,
  Ticket,
  ticketPriorityConfig,
  TicketStatus,
  ticketStatusConfig,
} from "@/types";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Link,
  Menu,
  Portal,
} from "@chakra-ui/react";
import axios from "axios";
import { LuArrowLeft, LuChevronDown, LuForward, LuPlay } from "react-icons/lu";

interface TicketHeaderProps {
  ticket: Ticket;
  setTicket: (ticket: Ticket) => void;
  isSpecialist: boolean;
  canEscalate: boolean;
  showEscalation: boolean;
  setShowEscalation: (isSet: boolean) => void;
  isOnLastLine: boolean;
}
export default function TicketHeader({
  ticket,
  setTicket,
  isSpecialist,
  canEscalate,
  showEscalation,
  setShowEscalation,
  isOnLastLine,
}: TicketHeaderProps) {
  const statusConf = ticketStatusConfig[ticket.status];
  const priorityConf = ticketPriorityConfig[ticket.priority];

  const canReassign = () => {
    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
      return false;
    }
    return true;
  };

  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      const updated = await ticketApi.changeStatus(ticket.id, {
        status: newStatus,
      });
      setTicket(updated);
      toaster.success({
        title: "Статус изменен",
        description: `Тикет переведен в статус "${ticketStatusConfig[newStatus].label}"`,
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toaster.error({
          title: "Ошибка",
          description: `Не удалось переадресовать тикет. ${error.response.data.message}`,
          closable: true,
        });
      } else {
        console.error(error);
        toaster.error({
          title: "Ошибка",
          description: "Неизвестная ошибка",
          closable: true,
        });
      }
    }
  };

  return (
    <Flex mb={6} justify="space-between" align="flex-start" wrap="wrap" gap={4}>
      <Box>
        <HStack mb={2}>
          <Link href="/dashboard/tickets">
            <Button variant="ghost" size="sm">
              <LuArrowLeft />
              Назад
            </Button>
          </Link>
        </HStack>
        <Heading size="lg" color="fg.default" mb={2}>
          #{ticket.id}: {ticket.title}
        </Heading>
        <HStack gap={3}>
          <Badge colorPalette={statusConf.color} size="lg">
            {statusConf.label}
          </Badge>
          <Badge colorPalette={priorityConf.color} variant="subtle" size="md">
            {priorityConf.label}
          </Badge>
        </HStack>
      </Box>

      {/* Action buttons */}
      <HStack gap={2}>
        {/* Take Ticket button - for specialists when ticket is unassigned */}
        {isSpecialist && !ticket.assignedTo && ticket.status === "NEW" && (
          <Button
            size="sm"
            colorPalette="green"
            onClick={async () => {
              try {
                const updated = await ticketApi.takeTicket(ticket.id);
                setTicket(updated);
                toaster.success({
                  title: "Успех",
                  description: "Тикет взят в работу",
                });
              } catch (error) {
                if (axios.isAxiosError(error) && error.response) {
                  toaster.error({
                    title: "Ошибка",
                    description:
                      error.response.data.message || "Не удалось взять тикет",
                    closable: true,
                  });
                } else {
                  toaster.error({
                    title: "Ошибка",
                    description: "Не удалось взять тикет",
                    closable: true,
                  });
                }
              }
            }}
          >
            <LuPlay />
            Взять в работу
          </Button>
        )}

        {/* Кнопка эскалации - только для специалистов */}
        {canEscalate && canReassign() && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowEscalation(!showEscalation)}
            disabled={isOnLastLine}
            opacity={isOnLastLine ? 0.5 : 1}
            title={
              isOnLastLine
                ? "Тикет уже на последней линии поддержки"
                : undefined
            }
          >
            <LuForward />
            {isOnLastLine ? "На последней линии" : "Переадресовать"}
          </Button>
        )}

        {/* Status change menu - only for specialists */}
        {isSpecialist &&
          (() => {
            const availableTransitions = statusTransitions[ticket.status];

            if (availableTransitions.length === 0) return null;

            return (
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button size="sm" variant="outline">
                    Изменить статус
                    <LuChevronDown />
                  </Button>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      {availableTransitions.map((status) => {
                        const conf = ticketStatusConfig[status];
                        return (
                          <Menu.Item
                            key={status}
                            value={status}
                            onClick={() => handleStatusChange(status)}
                          >
                            <Badge colorPalette={conf.color} size="sm" mr={2}>
                              {conf.label}
                            </Badge>
                          </Menu.Item>
                        );
                      })}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>
            );
          })()}
      </HStack>
    </Flex>
  );
}
