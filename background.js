// ---- 存储工具 ----
function saveText(t) {
  const text = (t || "").trim();
  if (!text) return;

  chrome.storage.local.get({ collected: [] }, ({ collected }) => {
    collected.push(text);
    chrome.storage.local.set({ collected });

    const messageTitle = "Collected Text";
    const messageContent = collected.join("\n");

    getActiveTabId().then((tabId) => {
      if (!tabId) return;

      chrome.scripting.executeScript({
        target: { tabId },
        func: (title, content) => {
          let box = document.createElement("div");

          // 标题
          let titleDiv = document.createElement("div");
          titleDiv.textContent = title;
          titleDiv.style.fontSize = "14px";
          titleDiv.style.fontWeight = "bold";
          titleDiv.style.color = "#fff";

          // 内容
          let contentDiv = document.createElement("div");
          contentDiv.textContent = content;
          contentDiv.style.fontSize = "12px";
          contentDiv.style.opacity = "0.8";
          contentDiv.style.marginTop = "4px";
          contentDiv.style.whiteSpace = "pre-wrap";
          contentDiv.style.color = "#fff";

          box.appendChild(titleDiv);
          box.appendChild(contentDiv);

          Object.assign(box.style, {
            position: "fixed",
            bottom: "20px",
            right: "20px",
            maxWidth: "40%",
            background: "rgba(0,0,0,0.75)",
            padding: "8px 12px",
            borderRadius: "6px",
            zIndex: 9999,
            transition: "opacity 0.5s",
          });

          document.body.appendChild(box);
          setTimeout(() => (box.style.opacity = "0"), 3000);
          setTimeout(() => box.remove(), 3500);
        },
        args: [messageTitle, messageContent]
      });
    });
  });
}


// ---- 获取当前活动标签页 ----
async function getActiveTabId() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab?.id;
}

// ---- 注入脚本抓取选中文本（包含输入框/文本域）----
async function grabSelection(tabId) {
  const [{ result } = {}] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN", // MAIN 更稳；默认 ISOLATED 也可
    func: () => {
      // 页面选区
      const s = window.getSelection?.();
      let txt = s && s.toString();
      // 如果是输入框/文本域的选区
      if (!txt) {
        const el = document.activeElement;
        const isInput =
          el &&
          (el.tagName === "TEXTAREA" ||
            (el.tagName === "INPUT" &&
              /^(text|search|url|tel|password|email|number)$/i.test(el.type)));
        if (isInput && typeof el.selectionStart === "number" && typeof el.selectionEnd === "number") {
          txt = el.value.substring(el.selectionStart, el.selectionEnd);
        }
      }
      return (txt || "").trim();
    }
  });
  return result || "";
}

// ---- 右键菜单 ----
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveText",
    title: "Collect Text",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "saveText") {
    saveText(info.selectionText);
  }
});

// ---- 快捷键 ----
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "save-selection") return;
  const tabId = await getActiveTabId();
  if (!tabId) return;
  try {
    const txt = await grabSelection(tabId);
    saveText(txt);
  } catch (e) {
    console.error("grabSelection failed:", e);
  }
});
