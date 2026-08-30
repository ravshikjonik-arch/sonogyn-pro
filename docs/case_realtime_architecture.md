# Realtime — архитектура обсуждений кейса

## Принцип

**Один канал на комнату кейса** — без глобальной подписки на все таблицы.

Hook: `apps/web/lib/cases/use-case-discussion-realtime.ts`  
Channel name: `case_discussion:{caseId}`

## События

| Таблица | События | Filter | Назначение |
|---------|---------|--------|------------|
| `teaching_case_comments` | INSERT, UPDATE | `case_id=eq.{id}` | Новые сообщения, pin/hide |
| `teaching_case_comment_reactions` | * | — | Счётчики реакций† |
| `case_lifecycle_events` | INSERT | `case_id=eq.{id}` | Смена статуса |
| `case_discussion_presence` | * | `case_id=eq.{id}` | Присутствие |

† Reactions без filter — клиент игнорирует чужие case_id (можно ужесточить в v3.1).

## Fallback

`NEXT_PUBLIC_REALTIME_POLLING_FALLBACK=true` → polling 10 с вместо Realtime.

## Очистка

```typescript
return () => {
  void supabase.removeChannel(channel);
};
```

При unmount компонента `TeachingCaseDiscussion` канал удаляется — **нет дублирующих подписок**.

## Presence

- Heartbeat: `POST /api/cases/[caseId]/presence` каждые 25 с
- Online count: `GET /api/cases/[caseId]/presence` (last 60 s)

## Unread indicator

- `GET/PUT /api/cases/[caseId]/read-cursor`
- Таблица `case_discussion_read_cursors`

## Notifications

- In-app: `case_discussion_notifications` (trigger на INSERT comment)
- Push: существующие Edge Functions `notify-new-comment` (Expo)

## Publication (migration)

Таблицы добавлены в `supabase_realtime`:
- `teaching_case_comment_reactions`
- `case_lifecycle_events`
- `case_discussion_presence`
- `case_discussion_notifications`

`teaching_case_comments` — уже в publication (`20260605140000`).
