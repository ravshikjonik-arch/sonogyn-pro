/**
 * k6 smoke: health + cases chat + messenger gate (no auth).
 * Run: k6 run scripts/k6/messenger-chat-v2-smoke.js -e BASE_URL=http://localhost:3000
 */
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  vus: Number(__ENV.K6_VUS || 3),
  duration: __ENV.K6_DURATION || "15s",
  thresholds: {
    http_req_failed: ["rate<0.15"],
    http_req_duration: ["p(95)<3000"],
  },
};

export default function messengerChatV2Smoke() {
  const health = http.get(`${BASE}/api/health`);
  check(health, {
    "health 200": (r) => r.status === 200,
    "rollout present": (r) => {
      try {
        const j = JSON.parse(r.body);
        return typeof j.rollout?.doctorChatV2 === "boolean";
      } catch {
        return false;
      }
    },
  });

  const casesChat = http.get(`${BASE}/cases?tab=chat`);
  check(casesChat, { "cases chat 200": (r) => r.status === 200 });

  const messenger = http.get(
    `${BASE}/api/messenger/messages?chatId=00000000-0000-4000-8000-000000000001&limit=1`,
  );
  check(messenger, {
    "messenger gated": (r) => r.status === 401 || r.status === 404,
  });

  sleep(0.3);
}
