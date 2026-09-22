(function () {
  try {
    var key = "app-theme";
    var theme = localStorage.getItem(key);
    if (!theme) return;
    theme = JSON.parse(theme);
    var html = document.documentElement;
    if (theme === "system") {
      html.removeAttribute("data-theme");
      return;
    }
    html.setAttribute("data-theme", theme);
  } catch (e) {}
})();
