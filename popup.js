function showMessage(msg) {
  let box = document.createElement("div");
  box.textContent = msg;
  Object.assign(box.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "rgba(0,0,0,0.7)",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    zIndex: 9999,
    transition: "opacity 0.5s",
  });
  document.body.appendChild(box);
  setTimeout(() => (box.style.opacity = "0"), 1500);
  setTimeout(() => box.remove(), 2000);
}

function refreshList() {
  chrome.storage.local.get({ collected: [] }, (data) => {
    document.getElementById("list").textContent = data.collected.join("\n");
  });
}

document.getElementById("copy").addEventListener("click", () => {
  chrome.storage.local.get({ collected: [] }, (data) => {
    navigator.clipboard.writeText(data.collected.join("\n"));
    showMessage("Copied!");
  });
});

document.getElementById("clear").addEventListener("click", () => {
  chrome.storage.local.set({ collected: [] }, refreshList);
    showMessage("Cleared!");
});

refreshList();
