/**
 * Конфиг AI-агента Филиппа Филипповича.
 * На GitHub Pages нет /api/chat — укажите n8n webhook или OpenAI-прокси.
 *
 * n8n: Webhook node → OpenAI Chat → Respond to Webhook { "answer": "..." }
 */
window.AZIMUT_CHAT_CONFIG = {
  provider: "auto",
  agentName: "Филипп Филипович",
  agentTitle: "Филипп Филипович",
  endpoint: "",
  fallbackPhone: "8 (925) 112 77 99"
};