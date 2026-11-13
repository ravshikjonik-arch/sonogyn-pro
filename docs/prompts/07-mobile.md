# Этап 7. Mobile / PWA (углубить parity, не второй продукт)

```
Ветка: feature/mobile-pwa.

Контекст: уже есть apps/mobile (Expo) и apps/web. Не начинай «с нуля React Native fork».

1. Web PWA: manifest / SW / install — если уже частично есть, добей пробелы; push для чата осторожно (iOS limits).
2. Parity ключевых экранов: помощник (Исслед. AI), Evidence, чат, деревья классификаций.
3. API: где возможно — стабильные контракты под mobile (не обязательно сразу /api/v1 везде;
   не ломай текущие routes).
4. Оценка Capacitor vs продолжение Expo — документ, без старта native rewrite без «ок».

Итог: что улучшено на web PWA + mobile; риски offline/PHI (SecureStore, upload).
```
