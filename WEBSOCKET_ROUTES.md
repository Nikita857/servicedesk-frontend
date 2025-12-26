# Assignment Notification Flow

## Обзор

При создании назначения (assignment) система отправляет real-time уведомления получателям через WebSocket.

## Архитектура

```
┌─────────────────┐     ┌─────────────┐     ┌────────────────────┐     ┌──────────────┐
│ AssignmentService│ ──► │  RabbitMQ   │ ──► │ TicketEventConsumer │ ──► │  WebSocket   │
│ createAssignment│     │   Queue     │     │ handleAssignment... │     │  /user/...   │
└─────────────────┘     └─────────────┘     └────────────────────┘     └──────────────┘
```

## Поток данных

### 1. Создание назначения (Backend)

**Файл:** `AssignmentService.java`

```java
// После сохранения назначения:

// 1. Уведомление подписчикам тикета (broadcast)
ticketEventPublisher.publishAssigned(ticket.getId(), assignedById, ticketMapper.toResponse(ticket));

// 2. Персональное уведомление получателю
if (saved.getToUser() != null) {
    // Прямое назначение конкретному специалисту
    ticketEventPublisher.publishAssignmentCreated(
            ticket.getId(),
            saved.getToUser().getId(),
            assignmentMapper.toResponse(saved));
} else {
    // Назначение на линию - всем специалистам линии
    toLine.getSpecialists().forEach(specialist ->
            ticketEventPublisher.publishAssignmentCreated(
                    ticket.getId(),
                    specialist.getId(),
                    assignmentMapper.toResponse(saved)));
}
```

### 2. Публикация события (TicketEventPublisher)

**Файл:** `TicketEventPublisher.java`

```java
public void publishAssignmentCreated(Long ticketId, Long toUserId, Object payload) {
    publish(TicketEvent.assignedToUser(ticketId, toUserId, payload));
}
```

**Событие:**

```java
TicketEvent.of(TicketEventType.ASSIGNMENT_CREATED, ticketId, toUserId, payload)
```

### 3. RabbitMQ Routing

- **Exchange:** `ticket.exchange`
- **Routing Key:** `ticket.assignment_created`
- **Queue:** `ticket.queue`

### 4. Обработка события (TicketEventConsumer)

**Файл:** `TicketEventConsumer.java`

```java
private void handleAssignmentCreated(TicketEvent event) {
    String destination = "/queue/assignments";
    messagingTemplate.convertAndSendToUser(
            event.userId().toString(),  // ID получателя
            destination,
            event.payload());
}
```

### 5. WebSocket Destination

| Метод                                         | Назначение                                     |
| --------------------------------------------- | ---------------------------------------------- |
| `convertAndSendToUser(userId, dest, payload)` | Персональная отправка конкретному пользователю |

**Итоговый путь для пользователя с ID `123`:**

```
/user/123/queue/assignments
```

## Подписка на Frontend

### React/TypeScript

```typescript
import { Client } from "@stomp/stompjs";

const client = new Client({
  brokerURL: "ws://localhost:8080/ws",
  // ...
});

client.onConnect = () => {
  // Подписка на персональные уведомления о назначениях
  client.subscribe("/user/queue/assignments", (message) => {
    const assignment = JSON.parse(message.body);
    console.log("New assignment:", assignment);
    // Обновить UI, показать уведомление
  });
};
```

## Payload (AssignmentResponse)

```json
{
  "id": 1,
  "ticketId": 42,
  "ticketTitle": "Проблема с принтером",
  "fromLine": {
    "id": 1,
    "name": "1C Support"
  },
  "toLine": {
    "id": 2,
    "name": "Sysadmin"
  },
  "fromUser": {
    "id": 5,
    "username": "support1",
    "fio": "Иванов И.И."
  },
  "toUser": {
    "id": 10,
    "username": "admin1",
    "fio": "Петров П.П."
  },
  "mode": "DIRECT",
  "status": "PENDING",
  "note": "Срочно нужна помощь",
  "createdAt": "2025-12-26T08:30:00Z"
}
```

## Типы событий

| Тип                  | Назначение                   | WebSocket Path                     |
| -------------------- | ---------------------------- | ---------------------------------- |
| `ASSIGNED`           | Broadcast подписчикам тикета | `/topic/ticket/{ticketId}`         |
| `ASSIGNMENT_CREATED` | Персональное уведомление     | `/user/{userId}/queue/assignments` |

## Связанные файлы

- `TicketEventType.java` - Enum типов событий
- `TicketEvent.java` - Record события
- `TicketEventPublisher.java` - Публикация в RabbitMQ
- `TicketEventConsumer.java` - Обработка и отправка в WebSocket
- `AssignmentService.java` - Бизнес-логика назначений
