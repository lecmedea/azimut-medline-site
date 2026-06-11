window.AzimutPayment = {
  createPayment(order) {
    console.info("Payment integration placeholder:", order);
    return Promise.resolve({ ok: true, mode: "placeholder" });
  }
};
