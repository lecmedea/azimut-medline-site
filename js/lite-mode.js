/**
 * Лёгкий режим для старых и слабых мобильных устройств (до ~2019).
 * Ставит класс lite-mode на <html> до отрисовки тяжёлых эффектов.
 */
(function () {
  var root = document.documentElement;
  if (root.classList.contains("lite-mode")) return;

  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  var ua = navigator.userAgent || "";
  var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  if (!mobile) return;

  var saveData = conn && conn.saveData;
  var lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2;
  var lowCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  var iosMatch = ua.match(/OS (\d+)[_.]/i);
  var oldIOS = iosMatch && Number(iosMatch[1]) < 13;
  var androidMatch = ua.match(/Android (\d+)/i);
  var oldAndroid = androidMatch && Number(androidMatch[1]) < 9;
  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) {}

  if (saveData || lowMemory || lowCpu || oldIOS || oldAndroid || reducedMotion) {
    root.classList.add("lite-mode");
    root.dataset.liteReason = saveData ? "save-data" : lowMemory ? "memory" : oldIOS || oldAndroid ? "legacy-os" : lowCpu ? "cpu" : "motion";
  }
})();