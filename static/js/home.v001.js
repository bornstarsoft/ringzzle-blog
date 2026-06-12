(function () {
  var card = document.querySelector("[data-ringzzle-app-card]");
  if (!card) return;

  var ua = (window.navigator && window.navigator.userAgent || "").toLowerCase();
  var platform = "desktop";

  if (ua.indexOf("android") !== -1) {
    platform = "android";
  } else if (/iphone|ipad|ipod/.test(ua)) {
    platform = "ios";
  }

  card.dataset.platform = platform;
})();
