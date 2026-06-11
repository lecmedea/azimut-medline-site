window.AzimutBitrix = {
  sendLead(payload) {
    console.info("Bitrix24 integration placeholder:", payload);
    console.info("Здесь будет подключение webhook Битрикс24");
    return Promise.resolve({ ok: true, mode: "placeholder" });
  },
  sendChatLeadToBitrix24(leadData) {
    console.log("Здесь будет отправка лида из AI-чата в Битрикс24", leadData);
    return Promise.resolve({ ok: true, mode: "chat-placeholder" });
  }
};
