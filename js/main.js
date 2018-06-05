const windows = document.getElementsByClassName("window");

for (const trayIcon of document.getElementsByClassName("tray-icon")) {
  trayIcon.addEventListener("click", () => {
    updateView(trayIcon.getAttribute("href").replace("#", ""));
  });
}

function updateView(view) {
  let activeElement = document.getElementById(view);
  for (const window of windows) {
    window.classList.remove("active");
  }
  activeElement.classList.add("active");
  document.dispatchEvent(new CustomEvent("viewSwitch", { detail: { view } }));
}

let activeView = window.location.hash.replace("#", "") || "terminal";
updateView(activeView);
