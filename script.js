
// ✅ 公用打字機函式
async function typeTextBlock({
  lines = [],
  targetEl,
  perCharDelay = 40,
  perLineDelay = 600,
  usePre = false,
  className = "",
  onComplete = null // ✅ 加上這行！
}) {
  for (let i = 0; i < lines.length; i++) {
    const container = usePre ? document.createElement("pre") : document.createElement("p");
    if (className) container.classList.add(...className.split(" "));
    targetEl.appendChild(container);

    for (let j = 0; j < lines[i].length; j++) {
      container.textContent += lines[i][j];
      await wait(perCharDelay);
    }

    await wait(perLineDelay);
  }

  // ✅ 執行 onComplete（如果有給）
  if (onComplete) await onComplete();
}


//共用輸入建立函式
function createTerminalInput({ onSubmit }) {
  const output = document.getElementById("terminalOutput");

  const line = document.createElement("div");
  line.className = "input-line";

  const label = document.createElement("span");
  label.textContent = "> ";
  line.appendChild(label);

  const wrapper = document.createElement("div");
  wrapper.className = "terminal-input-wrapper";

  const mirror = document.createElement("span");
  mirror.className = "mirror-text";
  wrapper.appendChild(mirror);

  const caret = document.createElement("span");
  caret.className = "fake-caret";
  wrapper.appendChild(caret);

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "latin";
  input.className = "inline-input";
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("spellcheck", "false");
  input.setAttribute("inputmode", "text");
  wrapper.appendChild(input);

  line.appendChild(wrapper);
  output.appendChild(line);

  // ✅ 新增一個 status 區塊
  const status = document.createElement("p");
  status.className = "status-line";
  status.textContent = "";
  output.appendChild(status);

  requestAnimationFrame(() => {
    setTimeout(() => {
      // ✅ iOS Safari 聚焦 hack：先 readonly 再移除
      input.setAttribute("readonly", "true");
      input.removeAttribute("readonly");
      input.focus();
    }, 10);
  });

  input.addEventListener("input", (e) => {
    mirror.textContent = e.target.value;
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const entered = input.value.trim();
      input.disabled = true;
      caret.remove();
      mirror.classList.add("submitted-text");

      if (onSubmit) onSubmit(entered, status); 
    }
  });

  input.addEventListener("blur", () => {
    if (!input.disabled && input.value.trim() !== "") {
      input.disabled = true;
      caret.remove();
      mirror.classList.add("submitted-text");

      if (onSubmit) onSubmit(input.value.trim(), status);
    }
  });



}



let userAccount = "";
const verificationFlags = {
  "404": false, "241": false,"505": false,
  "510": false,  "233": false, "987": false
};


// ✅ 登入流程與 Firebase 寫入
window.addEventListener("DOMContentLoaded", () => {


  const loginScreen = document.getElementById("loginScreen");
  const mainScreen = document.getElementById("mainScreen");
  const submitButton = document.getElementById("submitButton");
  const accountInput = document.getElementById("account");
  const passwordInput = document.getElementById("password");
  const terminalOutput = document.getElementById("terminalOutput");

  const forgotLink = document.querySelector(".forgot-password");
  if (forgotLink) {
    forgotLink.addEventListener("click", showForgotPasswordPopup);
  }

  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitButton.click();
  });

  submitButton.addEventListener("click", async () => {
    const account = accountInput.value.trim();
    const password = passwordInput.value.trim();
    window.loginPassword = password;
    const validPattern = /^[A-Za-z0-9]+$/;

    if (!account || !password) return alert("請輸入帳號與密碼！");
    if (!validPattern.test(password)) return alert("密碼需為英數字元！");

    loginScreen.classList.remove("active");
    mainScreen.classList.add("active");
    terminalOutput.innerHTML = "";
    submitButton.disabled = true; // 👈 禁止重複點擊

    updateLoginStatus(account, verificationFlags);
    // ✅ 顯示開場說明再啟用輸入
    await typeTextBlock({
      lines: [
        ">警告：安全防護薄弱，已將帳號鎖定。",
        ">...開啟終端機系統。",
        ">請輸入驗證代碼，以驗證身分：",
        "#操作流程說明，請輸入「說明」。",
        "#欲了解更多，請輸入「更多」。"
      ],
      targetEl: terminalOutput,
      onComplete: () => enableTerminalInput()
    });
    submitButton.disabled = false; 
  });
});

// ✅ Firebase 進度更新與列印提交
function updateProgressBar(flags) {
  const count = Object.values(flags).filter(Boolean).length;
  const total = Object.keys(flags).length;
  const fill = document.getElementById("progressFill");
  const label = document.getElementById("progressText");

  // ✅ 進度條更新
  if (fill) fill.style.width = `${(count / total) * 100}%`;
  if (label) label.textContent = `${count} / ${total} 已完成`;

  // ✅ 檢查是否全部驗證完畢
  const allVerified = Object.values(flags).every(v => v);
  if (allVerified && !window._finalTriggered) {
    window._finalTriggered = true; // 防止重複觸發
    triggerFinalSequenceWithFlicker();
  }
}


// ✅ 忘記密碼視窗 popup
function showForgotPasswordPopup() {
  const existing = document.getElementById("forgotOverlay");
  if (existing) existing.remove();

  let step = 1;
  let rescuedId = "";

  const overlay = document.createElement("div");
  overlay.id = "forgotOverlay";
  overlay.className = "overlay";

  const popup = document.createElement("div");
  popup.className = "popup";

  const closeBtn = document.createElement("button");
  closeBtn.className = "close-btn";
  closeBtn.innerHTML = "&times;";
  closeBtn.addEventListener("click", () => overlay.remove());

  const text = document.createElement("p");
  text.innerHTML = "請輸入帳號名稱";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "who r u?";

  const submitBtn = document.createElement("button");
  submitBtn.className = "submit-button";
  submitBtn.textContent = "確認";

  const warning = document.createElement("div");
  warning.style.color = "#f66";
  warning.style.fontSize = "0.85em";
  warning.style.display = "none";
  warning.style.marginTop = "1em";

  // ✅ 封裝成共用的提交處理函式
  function handleSubmit() {
    const value = input.value.trim();
    if (step === 1) {
      if (!value) return;
      rescuedId = value;
      step = 2;
      text.innerHTML = "請輸入復原碼(13碼)";
      input.value = "";
      input.placeholder = "？？？？？";
      warning.style.display = "none";
    } else if (step === 2) {
      if (value === "He2Re80am429i") {
        overlay.remove();
        alert("✅ 成功輸入復原碼！你找回了你自己！");
      } else {
        warning.textContent = "錯誤的復原碼，請再試一次。";
        warning.style.display = "block";
      }
    }
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  });

  submitBtn.addEventListener("click", handleSubmit);

  // ✅ 排列順序調整：先關閉按鈕，再標題、輸入框、送出與警告訊息
  popup.appendChild(closeBtn);
  popup.appendChild(text);
  popup.appendChild(input);
  popup.appendChild(submitBtn);
  popup.appendChild(warning);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}

//He2Re80am429I
function showCatConnectWarning(onConfirm) {
  const existing = document.getElementById("catConnectOverlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "catConnectOverlay";
  overlay.className = "overlay";

  const popup = document.createElement("div");
  popup.className = "popup";

  const title = document.createElement("h3");
  title.textContent = "是否允許連線？";
  title.style.fontSize = "1.2em";
  title.style.marginBottom = "0.5em";

  const body = document.createElement("p");
  body.textContent = "即將與未知裝置「貓貓」開啟連線通話。";
  body.style.fontSize = "0.95em";

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "允許";
  confirmBtn.className = "submit-button";
  confirmBtn.style.marginTop = "1.5em";
  confirmBtn.style.width = "100%";
  confirmBtn.addEventListener("click", () => {
    overlay.remove();
    if (typeof onConfirm === "function") onConfirm();
  });

  popup.appendChild(title);
  popup.appendChild(body);
  popup.appendChild(confirmBtn);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}




//置頂系統消息
function updateLoginStatus(account, flags) {
  const banner = document.getElementById("loginBanner");
  const count = Object.values(flags).filter(Boolean).length;
  const message = `ID: [ ${account} ] 登入成功！ 已完成驗證: ${count}/6 `;
  if (banner) {
    banner.textContent = "";
    typeTextBlock({
      lines: [message],
      targetEl: banner,
      perCharDelay: 20
    });
  }
}

//重複驗證提示
async function handleVerificationCommand(code, handler) {
  if (!verificationFlags[code]) {
    await handler(); // ✅ 等流程結束才標記成功
  } else {
    const output = document.getElementById("terminalOutput");
    typeTextBlock({
      lines: ["> 該代碼已驗證，請勿重複輸入。"],
      targetEl: output,
      onComplete: () => enableTerminalInput() // ✅ 修正這裡也需要真正啟動輸入
    });
  }
}



async function handleCommand(code) {
  const map = {
    "404": runCode404Sequence,
    "241": runCode241Sequence,
    "510": runCode510Sequence,
    "505": runCode505Sequence,
    "233": runCode233Sequence,
    "987": runCode987Sequence,
    "說明": showHelpPopup,
    "更多": showMorePopup
  };
  const normalized = code.trim();
  if (normalized === "6121021") {
    Object.keys(verificationFlags).forEach(k => verificationFlags[k] = true);
    updateProgressBar(verificationFlags);
    triggerFinalSequenceWithFlicker();
    return;
  }


  if (map[code]) {
    await handleVerificationCommand(code, map[code]); // ✅ 加上 await
  } else {
    const output = document.getElementById("terminalOutput");
    typeTextBlock({
      lines: ["> 錯誤：無效的驗證碼，請再試一次。"],
      targetEl: output,
      onComplete: () => enableTerminalInput()
    });
  }
}


function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// 404-------------------------------
async function runCode404Sequence() {
  const output = document.getElementById("terminalOutput");

  await typeTextBlock({
    lines: [
      ">輸入代碼404，即將開始驗證程序。",
      ">我們需要確保你不是機器人。",
      ">請勾選下方的選項以完成驗證。"
    ],
    targetEl: output
  });

  // 🔽 打字完再插入 checkbox
  showCheckboxChallenge(); // 或 insertCheckboxChallenge()，依你命名
}

function showCheckboxChallenge() {
  let checkboxVerified = false;
  const output = document.getElementById("terminalOutput");

  const label = document.createElement("label");
  label.className = "checkbox-label";
  label.innerHTML = `<input type="checkbox" id="robotCheck"> 我不曾是機器人`;

  output.appendChild(label);

  const checkbox = label.querySelector("#robotCheck");
  checkbox.addEventListener("change", () => {
  if (checkboxVerified || !checkbox.checked) return;
    checkboxVerified = true;
    checkbox.disabled = true;
    runCheckboxAnalysis();
  });
}

async function runCheckboxAnalysis() {
  const output = document.getElementById("terminalOutput");

  await typeTextBlock({
    lines: [
      "__________________________",
      ">系統正在分析你的判斷。",
      ">這可能需要幾秒鐘，請稍後。"
    ],
    targetEl: output
  });

  // 加入進度條動畫
  const loadingBar = document.createElement("div");
  loadingBar.className = "loading-bar";
  loadingBar.textContent = "█░░░░░░░░░";
  output.appendChild(loadingBar);

  const barStages = [
    "█░░░░░░░░░", "██░░░░░░░░", "███░░░░░░░", "████░░░░░░",
    "█████░░░░░", "██████░░░░", "███████░░░", "████████░░",
    "█████████░", "██████████"
  ];

  for (let i = 1; i < barStages.length; i++) {
    await wait(200);
    loadingBar.textContent = barStages[i];
  }

  output.removeChild(loadingBar);

  // ✅ 顯示 ASCII + 完成驗證
  await showAsciiAndFinish();
}

async function showAsciiAndFinish() {
  const output = document.getElementById("terminalOutput");

  const asciiLines = [
    "⡏⠉⠛⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿",
    "⣿⠀⠀⠀⠈⠛⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠛⠉⠁⠀⣿",
    "⣿⣧⡀⠀⠀⠀⠀⠙⠿⠿⠿⠻⠿⠿⠟⠿⠛⠉⠀⠀⠀⠀⠀⣸⣿⣿",
    "⣿⣿⣷⣄⠀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣿⣿⣿⣿",
    "⣿⣿⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⣴⣿⣿⣿⣿⣿",
    "⣿⣿⣿⡟⠀⠀⢰⣹⡆⠀⠀⠀⠀⠀⠀⣭⣷⠀⠀⠀⠸⣿⣿⣿⣿⣿",
    "⣿⣿⣿⠃⠀⠀⠈⠉⠀⠀⠤⠄⠀⠀⠀⠉⠁⠀⠀⠀⠀⢿⣿⣿⣿⣿",
    "⣿⣿⣿⢾⣿⣷⠀⠀⠀⠀⡠⠤⢄⠀⠀⠀⠠⣿⣿⣷⠀⢸⣿⣿⣿⣿",
    "⣿⣿⣿⡀⠉⠀⠀⠀⠀⠀⢄⠀⢀⠀⠀⠀⠀⠉⠉⠁⠀⠀⣿⣿⣿⣿",
    "⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣿⣿⣿⣿",
    "⣿⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿"
  ];

  await typeTextBlock({
    lines: asciiLines,
    targetEl: output,
    usePre: true,
    className: "ascii-block",
    perCharDelay: 5,
    perLineDelay: 100
  });

  const errorLine = document.createElement("p");
  errorLine.textContent = "> 錯誤代碼: 404";
  errorLine.style.textDecoration = "line-through";
  output.appendChild(errorLine);
  verificationFlags["404"] = true;
  updateProgressBar(verificationFlags);
  updateLoginStatus(userAccount, verificationFlags);

  await typeTextBlock({
    lines: [`>>驗證完成。（${Object.values(verificationFlags).filter(Boolean).length}/6）`],
    targetEl: output
  });

  enableTerminalInput(); // ✅ 回到主輸入
}

// -----------------------------------------------------

// 505-----------------------------------------------------
async function runCode505Sequence() {
  const output = document.getElementById("terminalOutput");

  await typeTextBlock({
    lines: [
      ">輸入代碼505，即將開始驗證程序。",
      ">請再次輸入該帳號的密碼："
    ],
    targetEl: output
  });

  startPasswordRetry(); // ✅ 這樣才會在打完字後真正執行
}

let passwordRetryCount = 0;
let passwordOverride = false;
let passwordLocked = false;

function startPasswordRetry() {
  createTerminalInput({
    onSubmit: (entered, status) => {
      if (passwordLocked) return;

      passwordRetryCount++;

      if (passwordRetryCount >= 3) {
        status.textContent = ">輸入錯誤3次。若忘記密碼，請輸入「Password」。";
        setTimeout(() => promptForPasswordUnlock(), 600);
        return;
      }

      if (entered === window.loginPassword) {
        status.textContent = ">密碼約一分鐘前已更改(大概位置:巴西)。請再試一次。";
      } else {
        status.textContent = ">輸入錯誤，請再試一次。";
      }

      setTimeout(() => startPasswordRetry(), 600);
    }
  });
}

function promptForPasswordUnlock() {
  createTerminalInput({
    onSubmit: (entered, status) => {
      if (entered === "Password" ||"password" ||"PASSWORD") {
        passwordLocked = true;
        status.innerHTML = `>輸入正確。<br>>帳戶救援已啟動（代號：SOS）。<br>>有新的暗網報告，是否查看？Y/N`;
        handleDarkWebPrompt();
      } else {
        status.textContent = ">輸入錯誤多次。請輸入「Password」，系統將協助您找回密碼。";
        setTimeout(() => promptForPasswordUnlock(), 600);
      }
    }
  });
}

function handleDarkWebPrompt() {
  const output = document.getElementById("terminalOutput");

  createTerminalInput({
    onSubmit: (choice, status) => {
      choice = choice.trim().toLowerCase();

      if (choice === "y") {
        showDarkWebReport(); // ✅ 進入後續劇本
      } else if (choice === "n") {
        typeTextBlock({
          lines: [            
            ">此帳號相關資訊曾於暗網中出現。建議查看報告，以採取相應防護措施。"
          ],
          targetEl: output
        }).then(() => {
          return typeTextBlock({
            lines: [">有新的暗網報告，是否查看？Y/N"],
            targetEl: output
          });
        }).then(() => {
          handleDarkWebPrompt(); // 🔁 再問一次
        });
      } else {
        // ❌ 非 y/n 的錯誤輸入
        typeTextBlock({
          lines: [">錯誤，僅可回答「Y」es或「N」o"],
          targetEl: output
        }).then(() => {
          return typeTextBlock({
            lines: [">有新的暗網報告，是否查看？Y/N"],
            targetEl: output
          });
        }).then(() => {
          handleDarkWebPrompt(); // 🔁 再問一次
        });
      }
    }
  });
}

async function showDarkWebReport() {
  const output = document.getElementById("terminalOutput");
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const hour = today.getHours();      // 0–23
  const minute = today.getMinutes();  // 0–59

  await typeTextBlock({
    lines: [
      ">",
      "我們在暗網上發現你的個人資訊。",
      `你的資訊因資料侵害事件遭到外洩，並於2025年${month}月${day}日出現在暗網中。以下為帳號[ ${userAccount} ]的可疑活動紀錄：`,
      "____________________________________________",
      `　2分鐘前 IP_200.103.149.187  巴西，聖若澤`,
      "　　工作階段類型：成功登入 (...這不是你?)",
      "____________________________________________",
      "　5分鐘前 IP_154.203.42.223  日本，長野",
      "　　工作階段類型：密碼錯誤，登入失敗",
      "____________________________________________",
      "　1小時前 IP_61.130.204.144 中國，嘉興",
      "　　工作階段類型：密碼錯誤，登入失敗",
      "____________________________________________",
      "　1小時前 IP_104.239.106.202 美國，費城",
      "　　工作階段類型：密碼錯誤，登入失敗  ....more"
    ],
    targetEl: output,
    perCharDelay: 20,
    perLineDelay: 100
  });

  await wait(150);

  await typeTextBlock({
    lines: [
      "____________________________________________",
      "",
      "系統在此資料侵害事件中，找到與你個資監控檔相符的資訊。",
      "-",
      `>查詢時間：${month}_${day} ${hour}:${minute}。`,
      `>已被公開至暗網中的密碼：[${window.loginPassword}]`,
      "-",
      ">⚠️為了保護帳號安全，請您立即變更密碼。"
    ],
    targetEl: output,
    onComplete: () => promptNewPassword()
  });
}

function promptNewPassword() {
  const output = document.getElementById("terminalOutput");

  typeTextBlock({
    lines: [">請輸入新密碼（建議英數混和）:"],
    targetEl: output,
    onComplete: () => {
      createTerminalInput({
        onSubmit: (entered, status) => {
          if (!/^[a-zA-Z0-9]+$/.test(entered)) {
            status.textContent = ">密碼格式錯誤，只能包含英文字母與數字。";
            setTimeout(() => promptNewPassword(), 600); // 🔁 再問一次新密碼
            return;
          }

          if (entered === window.loginPassword) {
            status.textContent = ">原密碼已遭外洩，請設定新密碼，保護帳號安全。";
            setTimeout(() => promptNewPassword(), 600); // 🔁 再問一次新密碼
            return;
          }

          window.loginPassword = entered; // ✅ 更新密碼
          promptPasswordConfirmation();
        }
      });
    }
  });
}

function promptPasswordConfirmation() {
  const output = document.getElementById("terminalOutput");

  typeTextBlock({
    lines: [">再次確認密碼:"],
    targetEl: output,
    onComplete: () => {
      createTerminalInput({
        onSubmit: (entered, status) => {
          if (entered !== window.loginPassword) {
            status.textContent = ">❌密碼不一致，請重新確認。";
            promptPasswordConfirmation(); // 🔁 再問一次
            return;
          }

          typeTextBlock({
            lines: [
              "......",
              ">密碼強度：極弱。",
              ">✅已更新密碼。",
              ">事發緊急，但還是請記好密碼。",
              ">畢竟連密碼都記不得的話，你要怎麼證明自己？",
              ">請謹記，你隨時可能被取代。"
            ],
            targetEl: output,
            onComplete: () => markVerificationComplete("505", output)
          });
        }
      });
    }
  });
}

// -----------------------------------------------------
//233 -----------------------------------------------------
function runCode233Sequence() {
  const output = document.getElementById("terminalOutput");

  typeTextBlock({
    lines: [">輸入代碼233，即將開始驗證程序。"],
    targetEl: output,
    onComplete: () => {
      showCatConnectWarning(() => {
        typeTextBlock({
          lines: [
            ">裝置已連接。",
            ">......",
            "",
            "            /| _ ╱|、  ",
            "           ( •̀ㅅ •́  )",
            "     ＿ノ ヽ ノ＼＿ ",
            "  /　`/ ⌒Ｙ⌒ Ｙ　 \\",
            "( 　(三ヽ人　 /　 　|",
            "|　ﾉ⌒＼ ￣￣ヽ　 ノ",
            "ヽ＿＿＿＞､＿＿／",
            "          ｜( 王 ﾉ〈 ",
            "           /ﾐ`ー―彡\\ ",
            "          |╰          ╯|",
            "          |       /\\     |",
            "          |      /  \\    |",
            ">",
            ">：嘿！",
            ">：對！就是你！",
            ">：從你走進這裡開始，就在注意你了。",
            ">：你...很可疑哦！！"
          ],
          targetEl: output,
            className: "ascii-tight",
            usePre: true,
            perCharDelay: 5,
            perLineDelay: 100,
            onComplete: () => showCatQuestion()
        });
      });
    }
  });
}
function showCatQuestion() {
  const output = document.getElementById("terminalOutput");

  const form = document.createElement("form");
  form.className = "question-form";

  const options = [
    { label: "A", text: "你誰啊？你才可疑吧！", reply: [">：哦！既然你誠心誠意ㄉ發問ㄌ──", ">･*･:≡(　ε:)"] },
    { label: "B", text: "好囉嗦哦，幹嘛啦!?", reply: [">：竟敢說我囉嗦!我這麼可愛欸!", ">(´,,•ω•,,)♡"] }
  ];

  options.forEach(opt => {
    const div = document.createElement("div");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "catAnswer";
    input.value = opt.label;
    input.id = `cat-${opt.label}`;
    input.className = "custom-radio";

    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.textContent = `${opt.label}. ${opt.text}`;
    label.className = "custom-radio-label";

    div.appendChild(input);
    div.appendChild(label);
    form.appendChild(div);
  });

  const submit = document.createElement("button");
  submit.textContent = "確認⏎";
  submit.className = "submit-button";
  form.appendChild(submit);
  output.appendChild(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const choice = form.querySelector("input[name='catAnswer']:checked");
    if (!choice) return;

    const chosen = options.find(o => o.label === choice.value);
    const userLine = `> ${chosen.label}. ${chosen.text}`;
    form.remove();

    typeTextBlock({
      lines: [userLine],
      targetEl: output,
      onComplete: () => {
        // ✅ 再顯示貓貓回應
        typeTextBlock({
          lines: chosen.reply,
          targetEl: output,
          onComplete: () => showCatPasswordPrompt()
        });
        }
    });
  });
}
function showCatPasswordPrompt() {
  const output = document.getElementById("terminalOutput");

  typeTextBlock({
    lines: [
      ">*咳*",
      ">：在下名為貓貓，收到了監控通報",
      ">：說有人在房間裡走來走去、探頭探腦的",
      ">：懷疑是什麼怪人= =",
      ">：於是！憑藉著正義的意志！",
      ">：貓貓就順著訊號波潛入你的手機了~",
      ">*盯──*",
      ">：你是登入進來的吧？",
      ">：想必你能回答出這個帳號的密碼~",
      ">：是什麼ㄋ!？（遞麥克風🎤",
      ">",
      ">請輸入密碼："
    ],
    targetEl: output,
    onComplete: () => {
      createTerminalInput({
        onSubmit: (entered, status) => {
          if (entered !== window.loginPassword) {
            status.textContent = `>：錯了喵！應該是${window.loginPassword} 才對吧！？`;
          }else{status.textContent = ">：叮咚！回答正確喵！";}
          setTimeout(() => showCatFinalChallenge(), 800);
        }
        
      });
    }
  });
}
function showCatFinalChallenge() {
  const output = document.getElementById("terminalOutput");

  typeTextBlock({
    lines: [
      ">：不過，說的也是！",
      ">：在這個需要雙重認證的時代",
      ">：密碼不足以證明什麼！",
      ">：我們讓『神』來指示吧！",
      ">：聽說只有真實的存在",
      ">：才能收到『神』的訊息。",
      ">：你能證明自己嗎!?",
      ">",
      ">*驗證碼發送中......*"      
    ],
    targetEl: output,
    onComplete: () => showCatCodePopup()
  });
}
function showCatCodePopup() {
  const output = document.getElementById("terminalOutput");
  alert(
    `\n【身份驗證通知】\n\n驗證程序已啟動，請在 5 分鐘內\n輸入以下驗證碼完成操作：\n\n🔐 一次性驗證碼：48217\n－－－－－－－－－－－－－－－－\n提醒請勿將驗證碼提供他人或不明網站，避免遭詐騙或不法利用。\n \n逾時將視為驗證失敗，可能需要重新啟動程序。如非本人操作，請立即關閉此訊息。`
  );

  createTerminalInput({
    onSubmit: (entered, status) => {
      if (entered !== "48217") {
        status.textContent = ">錯誤，請再試一次。";
        setTimeout(() => showCatCodePopup(), 600);
        return;
      }

      typeTextBlock({
        lines: [
          ">：哦哦哦！！！",
          ">：你真的能傳達神的旨意喵！",
          ">：看來你真的是這個帳號的使用者本人。",
          ">：打擾了喵，祝你有美好的一天！",
          ">ฅ^•ﻌ•^ฅ",
          ">___",
          ">已與「貓貓」中斷連線。",
          ">......",
          ">是你，編號48217。",
        ],
        targetEl: document.getElementById("terminalOutput"),
        onComplete: () => markVerificationComplete("233", output)
      });
    }
  });
}

// -----------------------------------------------------
// 987-----------------------------------------------------
function runCode987Sequence() {
  const output = document.getElementById("terminalOutput");
  let currentQuestion = 0;
  let countA = 0;
  let countB = 0;
  let countC = 0;

  const questions = [
    {
      text: ">輸入代碼987，即將開始測驗。\n...zzZ...\n🪄 \n>你是房間裡哪一種存在？\n你似乎不小心睡著了。半夢半醒間，好像來到了一間陌生的房間。但意外地，對這個空間感受到溫暖、安靜、一種熟悉、想念的感覺。\n房間裡有一些簡易的家具、還有一扇沒開的窗。你不記得怎麼來的，但手上的手機上顯示著「登入成功」。\n ˍ+.,:☆：﹉*.;:。ˍ+.,:☆：﹉*.;:。ˍ+.,:☆：﹉*",
    },
    {
      text: ">(1/5)：📄書本裡的紙條\n你看到桌上的書夾著一張紙片，抽出來發現是一張泛黃的紙條，上面寫著一串斷裂的文字。",
      options: [
        "A. 不斷旋轉紙片、重新排列上面的文字。",
        "B. 小聲地念出那段話，會不會是什麼諧音聯想?",
        "C. 將紙條對折，夾回原頁，那應該不是我需要知道的。"
      ]
    },
    {
      text: ">(2/5)：📻桌上的收音機\n收音機靜靜亮著燈，你轉動旋鈕，突然傳出沙沙聲，似乎夾雜著有人在說話的聲音。",
      options: [
        "A. 微調頻率，試圖把話語拼湊完整。",
        "B. 閉上眼傾聽，莫名熟悉的聲音......是誰?",
        "C. 好吵哦，關掉它。"
      ]
    },
    {
      text: ">(3/5)：🔐奇特的密碼箱\n你在房間角落發現一個帶鎖的精緻盒子，幾個按鍵已被磨損，似乎有人曾頻繁使用過。",
      options: [
        "A. 觀察某些磨損的鍵，想依使用的痕跡找出可能的密碼。",
        "B. 不斷翻轉盒子，觀察著盒子上的花紋，或許能聯想出什麼。",
        "C. 放下盒子，線索應該在其他地方。"
      ]
    },
    {
      text: ">(4/5)：🪞鏡子裡的異常\n你走到牆邊，看到一面鏡子，邊角有些碎裂，覆滿塵粒，似乎很老舊了。鏡中的你動作、神情好像都有點奇怪。",
      options: [
        "A. 嘗試做各種動作，觀察鏡中的自己是否有延遲或錯位。",
        "B. 誰?誰在模仿我?它是冒牌者!",
        "C. 想多了吧，畢竟是在夢裡，小bug。"
      ]
    },
    {
      text: ">(5/5)：🌫️醒來的時刻\n忽然間，所有物件都消失了，只剩空盪的白色房間，不太像是現實場景。手機亮起，一個奇怪的彈出視窗只寫著一句：「這是你嗎？」",
      options: [
        "A. 是，這是我。",
        "B. 不，這不是我。",
        "C. 關閉視窗。"
      ]
    }
  ];

  // 顯示測驗題目（含選項）
  function showQuestion(index) {
    const q = questions[index];

    // 顯示題目描述
    typeTextBlock({
      lines: q.text.split("\n"),
      targetEl: output,
      onComplete: () => {
        if (!q.options) {
          // 開場描述，進到第一題
          currentQuestion++;
          showQuestion(currentQuestion);
          return;
        }

        // 顯示三個選項（radio input）
        const form = document.createElement("form");
        form.className = "question-form";

        ["A", "B", "C"].forEach((label, i) => {
          const div = document.createElement("div");
          const input = document.createElement("input");
          input.type = "radio";
          input.name = "answer";
          input.value = label;
          input.id = `q${index}-${label}`;
          input.className = "custom-radio";

          const span = document.createElement("label");
          span.htmlFor = input.id;
          span.textContent = q.options[i];
          span.className = "custom-radio-label";

          div.appendChild(input);
          div.appendChild(span);
          form.appendChild(div);
        });

        const submitBtn = document.createElement("button");
        submitBtn.textContent = "確認⏎";
        submitBtn.className = "submit-button";

        submitBtn.type = "submit";
        form.appendChild(submitBtn);
        output.appendChild(form);

        form.addEventListener("submit", (e) => {
        e.preventDefault();
        const selected = form.querySelector("input[name='answer']:checked");
        if (!selected) return;

        const choice = selected.value;
        if (choice === "A") countA++;
        if (choice === "B") countB++;
        if (choice === "C") countC++;

        // 📝 顯示歷史回答
        const chosenText = q.options[["A", "B", "C"].indexOf(choice)];
        const confirmLine = document.createElement("p");
        confirmLine.textContent = `  >${choice}. ${chosenText.slice(3)}`;
        output.appendChild(confirmLine);

        form.remove();
        currentQuestion++;

        if (currentQuestion < questions.length) {
          showQuestion(currentQuestion);
        } else {
          showAnalysisLoading(() => {
            showPersonalityResult(countA, countB, countC);
          });
        }
      });

      }
    });
  }

  showQuestion(currentQuestion);
}

function showAnalysisLoading(callback) {
  const output = document.getElementById("terminalOutput");

  // 顯示初始文字
  const loadingLine = document.createElement("p");
  loadingLine.textContent = "> 解析中";
  output.appendChild(loadingLine);

  // 加一個動畫的點點...
  let dotCount = 0;
  const interval = setInterval(() => {
    dotCount = (dotCount + 1) % 4;
    loadingLine.textContent = "> 解析中" + ".".repeat(dotCount);
  }, 500);

  // 等個 3 秒鐘再結束 loading
  setTimeout(() => {
    clearInterval(interval);
    loadingLine.textContent = "> 解析完成。";
    callback(); // ✅ 執行分析結果流程
  }, 8000);
}
function showPersonalityResult(countA, countB, countC) {
  const output = document.getElementById("terminalOutput");

  let resultText = "";
  let dominant = "";

  // 🧠 判斷最多的是哪個
  if (countA > countB && countA > countC) {
    dominant = "A";
  } else if (countB > countA && countB > countC) {
    dominant = "B";
  } else if (countC > countA && countC > countB) {
    dominant = "C";
  } else if (countA === countB && countA > countC) {
    dominant = "AB";
  } else if (countB === countC && countB > countA) {
    dominant = "BC";
  } else if (countA === countC && countA > countB) {
    dominant = "AC";
  }

  // 🎯 對應結果文字
  const resultMap = {
    A: [
      "🐈‍⬛",
      "▼ 系統識別碼：v2.7.6-Neko/001",
      "▼ 狀態：探索",
      "▼ 編譯映像：黑貓｜自由穿梭在房間裡，難以預測",
      "系統報告：",
      "你是一個主動型的觀察者，總是想了解事情背後的邏輯與原因。對細節很敏感，不太容易滿足於表面的答案，習慣自己動手檢查、拆解、確定。",
      "",
      "檔案紀錄：",
      "你不常直接表露情感，偏好用行動來理解世界。當面對陌生情境時，你會先分析，再決定要不要信任。"
    ],
    B: [
      "🌵",
      "▼ 系統識別碼：v2.4.3-Listener/002",
      "▼ 狀態：靜默",
      "▼ 編譯映像：仙人掌｜安靜地站在窗邊，觀察一切",
      "系統報告：",
      "你是一個感受力強、內心豐富的人，常能察覺他人情緒與氣氛變化。你不急著發表意見，而是選擇慢慢理解，再決定要不要回應。",
      "",
      "檔案紀錄：",
      "你傾向用溫和的方式與人相處，不會急著揭露自己，也不輕易關掉對別人的共鳴。"
    ],
    C: [
      "👻",
      "▼ 系統識別碼：v1.9.0-Ghost/000",
      "▼ 狀態：???",
      "▼ 編譯映像：無紀錄｜來過又離開，沒留下痕跡",
      "系統報告：",
      "你可能習慣保留自己，不太主動參與或表達，喜歡觀察勝過介入。有時你會選擇忽略，或者乾脆退出，讓事情自然結束。",
      "",
      "檔案紀錄：",
      "你不太在意留下記錄，對你來說，不參與有時也是一種選擇。你偏好讓事情「靜靜過去」，而非掀起太多波瀾。"
    ],
    AB: [
      "💡",
      "▼ 系統識別碼：v3.2.1-Light/012",
      "▼ 狀態：閃爍",
      "▼ 編譯映像：小夜燈｜在觀察與感受之間，記錄與回應",
      "系統報告：",
      "你是一個內外兼顧的人，既渴望了解，也會受到情緒牽動。你擅長留意細節，對環境變化十分敏銳，總能在還沒說出口前察覺事情的走向。",
      "",
      "檔案紀錄：",
      "你會選擇適當時機開口，懂得什麼時候該主動，什麼時候該等待。你不是躲在角落的人，也不是永遠站在中央的人，而是在兩者之間靈活切換的存在。"
    ],
    BC: [
      "🪡",
      "▼ 系統識別碼：v3.2.4-Blanket/023",
      "▼ 狀態：柔軟",
      "▼ 編譯映像：毛毯｜靜靜記錄微小，編織出自己的空間",
      "系統報告：",
      "你擁有強大的內在感受力，不需要太多語言，就能明白他人的狀態。你習慣慢慢理解，也願意花時間與人相處，但不是每一次靠近都需要回報。",
      "",
      "檔案紀錄：",
      "你不急著表達自己的想法，更重視是否與他人產生真正的連結。當你選擇回應時，多半是經過思考與感受之後的結果，溫柔但有分量。"
    ],
    AC: [
      "☕",
      "▼ 系統識別碼：v3.2.7-Coffee/013",
      "▼ 狀態：浮動",
      "▼ 編譯映像：冰咖啡｜尚未決定是否保存的設定檔，被暫存在夢與夢之間",
      "系統報告：",
      "你是一個喜歡觀察、保留、不急著定義自己的人。你願意參與，但更喜歡以自己的節奏靠近；你會分析，但不輕易下判斷，總留一點空間給「再想想看」。",
      "",
      "檔案紀錄：",
      "你不是疏離，只是選擇慢一點進入。你可以與人建立關係，也可以乾脆跳出框架。你不一定尋求確認，但內心始終清楚：這一切你有在注意。"
    ]
  };

  // 顯示結果文字
  typeTextBlock({
    lines: resultMap[dominant],
    targetEl: output,
    onComplete: () => {
      // ➤ 先顯示花紋與結語，再標記驗證完成
      typeTextBlock({
        lines: [
          "ˍ+.,:☆：﹉*.;:。ˍ+.,:☆：﹉*.;:。ˍ+.,:☆：﹉*",
          ">歡迎回來。",
          ">但我們還是在如夢似幻的虛擬之中。",
          ">...",
          ">因此更了解自己了嗎？",
          ">在虛擬之中，我們總是很相像。",
          ">*標籤寫入中...*",
          "> ",
          ">測驗紀錄已歸檔。",          
          ">(類型分類產生自Chat GPT，沒有任何根據。)"
        ],
        targetEl: output,
        onComplete: () => {
          markVerificationComplete("987", output, () => {   
            enableTerminalInput();         
          });
        }
      });
    }
  });

}

// -----------------------------------------------------
//241 -----------------------------------------------------
async function runCode241Sequence() {
  const output = document.getElementById("terminalOutput");
  await typeTextBlock({
    lines: [
      ">輸入代碼241，即將開始驗證程序。",
      ">為完成安全驗證，請向右滑動至標示位置。"
    ],
    targetEl: output
  });

  showSliderChallenge(); // ✅ 打字完成後再插入滑桿
}

function showSliderChallenge() {
  const output = document.getElementById("terminalOutput");

  const wrapper = document.createElement("div");
  wrapper.className = "slider-wrapper";

  const slider = document.createElement("input");
  slider.type = "range";
  slider.min = 0;
  slider.max = 100;
  slider.step = 1;
  slider.value = 0;
  slider.style.width = "100%";

  const target = Math.floor(Math.random() * 55) + 30;
  const dot = document.createElement("div");
  dot.className = "slider-target-dot";
  dot.style.left = `${target}%`;

  let hasSucceeded = false;
  let startTime = null;

  wrapper.appendChild(dot);
  wrapper.appendChild(slider);
  output.appendChild(wrapper);

  const statusLine = document.createElement("p");
  statusLine.textContent = "> ";
  output.appendChild(statusLine);

  slider.addEventListener("pointerdown", () => {
    if (startTime === null) {
      startTime = Date.now();
    }
  });

  slider.addEventListener("change", () => {
    if (hasSucceeded) return;

    const diff = Math.abs(slider.value - target);
    const tolerance = 4;

    if (diff <= tolerance) {
      hasSucceeded = true;
      slider.disabled = true;
      slider.classList.add("slider-success");

      statusLine.textContent = "> 正確。";

      const endTime = Date.now();
      const usedTime = ((endTime - startTime) / 1000).toFixed(1);
      const rank = Math.floor(Math.random() * 36) + 50;

      setTimeout(() => {
        typeTextBlock({
          lines: [
            `>用時 ${usedTime} 秒，比 ${rank}% 的使用者更快。`,
            ">......",
            ">或許可以再更好。",
            ">但就這樣吧👍"
          ],
          targetEl: output,
          onComplete: async () => {
            await markVerificationComplete("241", output); // ✅ 等這整段跑完再結束流程
          }
        });
      }, 300);
    } else {
      statusLine.textContent = ">滑動位置不正確，請重新操作。";
    }
  });
}

// -----------------------------------------------------
//510 -----------------------------------------------------
async function runCode510Sequence() {
  const output = document.getElementById("terminalOutput");

  await typeTextBlock({
    lines: [
      ">輸入代碼510，即將開始驗證程序。",
      "_________________________________",
      ">請將手機舉起到眼睛高度，並拿穩。"
    ],
    targetEl: output,
    perCharDelay: 30,
    perLineDelay: 600
  });

  await wait(1500);

  await typeTextBlock({
    lines: [">請拿穩10秒鐘。"],
    targetEl: output,
    perCharDelay: 30
  });
  await wait(6000);

  await typeTextBlock({
    lines: [">FACE ID驗證中......📸"],
    targetEl: output,
    perCharDelay: 30
  });
  await wait(3000);

  await typeTextBlock({
    lines: [">請將頭緩慢左右轉動。"],
    targetEl: output,
    perCharDelay: 30
  });
  await wait(1000);

  await animateProgressBar(output);
  await wait(1000);

  await typeTextBlock({
    lines: [">請緩慢地抬頭。"],
    targetEl: output,
    perCharDelay: 30
  });
  await wait(1000);

  await animateProgressBar(output);
  await wait(1000);

  await showFakeBuildingProgress(output);

  await typeTextBlock({
    lines: [
      ">我們其實並沒有實際開啟相機，請放心。",
      "> :) ",
      ">也或許其實有開到，誰知道呢。"
    ],
    targetEl: output,
    perCharDelay: 30,
    perLineDelay: 600
  });

await markVerificationComplete("510", output);
await wait(300);
}
function enableTerminalInput() {
  const input = document.querySelector(".inline-input");
  const mirror = document.querySelector(".mirror-text");
  const caret = document.querySelector(".fake-caret");

  // ✅ 如果已經有輸入欄，就重啟它（避免重複產生）
  if (input && mirror && caret) {
    input.disabled = false;
    input.value = "";
    mirror.textContent = "";
    caret.classList.remove("hidden");
    setTimeout(() => input.focus(), 10); // 確保 focus
  } else {
    // ✅ 沒有輸入欄時才新建一個
    createTerminalInput({ onSubmit: handleCommand });
  }

}

async function showFakeBuildingProgress(output) {
  const line = document.createElement("p");
  line.textContent = ">建立中...... ";
  output.appendChild(line);

  for (let i = 0; i <= 200; i += 8) {
    line.textContent = `>建立中...... (${i}%)`;
    await wait(100);
  }
}
async function markVerificationComplete(code, output, callback = null) {
  verificationFlags[code] = true;

  const allVerified = Object.values(verificationFlags).every(Boolean);
  if (allVerified && !window._finalTriggered) {
    window._finalTriggered = true;
    triggerFinalSequenceWithFlicker();  // ✅ 唯一結局觸發點
  }

  // 顯示驗證完成進度
  const verifiedCount = Object.values(verificationFlags).filter(v => v).length;
  await typeTextBlock({
    lines: [`>> 驗證完成。（${verifiedCount}/6）`],
    targetEl: output,
    perCharDelay: 30
  });

  updateProgressBar(verificationFlags);
  updateLoginStatus(userAccount, verificationFlags);

  // ✅ 若還沒滿，繼續執行 callback 或恢復輸入
  if (typeof callback === "function") {
    callback(); // 呼叫你額外傳入的動作（像是花紋、歸檔等等）
  } else {
    enableTerminalInput(); // 若沒傳 callback，就照原本邏輯恢復輸入
  }
}



async function animateProgressBar(output, total = 12, speed = 200) {
  const line = document.createElement("p");
  line.textContent = "  _ ";
  output.appendChild(line);

  const bar = document.createElement("span");
  line.appendChild(bar);

  for (let i = 0; i < total; i++) {
    bar.textContent += i < total  ? "█" : "░";
    await wait(speed);
  }
}


// 結局-----------------------------------------------------
function resetAllState() {
  userAccount = "";
  Object.keys(verificationFlags).forEach(k => verificationFlags[k] = false);

  document.getElementById("loginScreen").classList.add("active");
  document.getElementById("mainScreen").classList.remove("active");

  document.getElementById("account").value = "";
  document.getElementById("password").value = "";
  document.getElementById("terminalOutput").innerHTML = "";
  document.getElementById("loginBanner").textContent = "";
  updateProgressBar(verificationFlags);

  const submitButton = document.getElementById("submitButton");
  submitButton.disabled = false;
  submitButton.dataset.clicked = false;
}

function showFinalPopup() {
  if (window._finalPopupVisible || document.querySelector(".overlay")) return;
  window._finalPopupVisible = true;

  playSystemBeep(420, 0.35);

  // 🔄 強制清除現有的 overlay（保險處理）
  document.querySelectorAll(".overlay").forEach(el => el.remove());

  function showFirstPopup() {
    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const popup = document.createElement("div");
    popup.className = "popup";

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hh}${mm}`;
    const month = now.getMonth() + 1;
    const day = now.getDate();

    popup.innerHTML = `
      <h3>帳戶可疑活動警示</h3>
      <p>台灣台南市東區</p>
      <small>time: ${month}/${day}_${currentTime}</small><br><br>
      <b>這是你嗎？</b><br><br>
      <div style="display: flex; justify-content: center; gap: 20px;">
        <button class="submit-button">✅</button>
        <button class="submit-button">❌</button>
      </div>
    `;

    popup.querySelectorAll(".submit-button").forEach(btn => {
      btn.onclick = () => {
        overlay.remove();
        setTimeout(showSecondPopup, 300);
      };
    });

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }

  function showSecondPopup() {
    // ❗保險再清一次 overlay，確保視覺正常
    document.querySelectorAll(".overlay").forEach(el => el.remove());

    const overlay = document.createElement("div");
    overlay.className = "overlay";

    const popup = document.createElement("div");
    popup.className = "popup";
    
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const currentTime = `${hh}:${mm}`;
    const month = now.getMonth() + 1;
    const day = now.getDate();

    const displayUser = typeof userAccount === "string" && userAccount ? userAccount : "unknown";



    popup.innerHTML = `
      <b>🔥系統⚠︎錯誤</b><br>
      <small>time:${month}/${day}_${currentTime}</small><br> 
      <p>帳戶安全設定最後出現了▚不▀明錯誤<small>(>> SYS_ERR[φΩ91])</small>，因此系統▙無法證明您是否為帳戶使用者[ ${displayUser} ]本人。▖為保護帳戶▚安全▟，將強制終止▘本次連線，以防止進一步資訊洩漏▞▗。</p>
      <br> 
      <del>您可於進一步驗證後重新▀登入。</del>
      <p>或放棄成▚為▘虛擬▞，▖回到▟現實繼續觀展。</p>
      <br> 
      <p>(即將列印錯誤報告)</p>
      <small>....\n who r u?\n WHO AM I?</small>
      <button class="submit-button">▚▟ 登 出➛🚪▖</button>
    `;

    popup.querySelector("button").onclick = async () => {
      overlay.remove();
      resetAllState();
    };

    overlay.appendChild(popup);
    document.body.appendChild(overlay);
  }

  // ✅ 啟動結局第一彈窗
  showFirstPopup();
}


function triggerFinalSequenceWithFlicker() {
  if (window._finalTriggeredAlreadyRun) return;
  window._finalTriggeredAlreadyRun = true;

  const flicker = document.createElement("div");
  flicker.id = "screenFlicker";
  flicker.style.position = "fixed";
  flicker.style.top = 0;
  flicker.style.left = 0;
  flicker.style.width = "100vw";
  flicker.style.height = "100vh";
  flicker.style.background = "black";
  flicker.style.zIndex = 9998;
  flicker.style.opacity = 0;
  flicker.style.pointerEvents = "none";
  flicker.style.transition = "opacity 0.1s";
  document.body.appendChild(flicker);

  const pattern = [true, false, true, false, true, false, true];
  const durations = [80, 80, 80, 180, 80, 80, 80];

  let index = 0;
  function doFlicker() {
    if (index >= pattern.length) {
      flicker.remove();

      // 雙保險：即使 flicker.remove() 出錯也會在 2 秒後強制觸發結局
      setTimeout(() => {
        console.log("🟢 強制觸發結局視窗");
        showFinalPopup();
      }, 2000);

      return;
    }
    flicker.style.opacity = pattern[index] ? "1" : "0";
    setTimeout(doFlicker, durations[index]);
    index++;
  }

  doFlicker();
}



function playSystemBeep(frequency = 440, duration = 0.3) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = "square"; // 系統感的嗶聲
  oscillator.frequency.value = frequency;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  // 快速漸弱，避免太突兀
  gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}



// ✅ 只加一次！點空白叫出鍵盤（iOS 也有效）
document.addEventListener("click", (e) => {
  const input = document.querySelector(".inline-input");
  if (!input || input.disabled) return;

  const wrapper = document.querySelector(".terminal-input-wrapper");
  if (wrapper && wrapper.contains(e.target)) return;

  input.focus();
});




//資訊卡-------------------------------------------------------------

function showHelpPopup() {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const popup = document.createElement("div");
  popup.className = "popup";

  popup.innerHTML = `
    <h3>🔧操作說明</h3>
    <p>歡迎。您正身在「帳戶個人空間」中，在這個房間裡，四周共有6組「3位數驗證碼」。</p><p>請分別輸入6組數字，沒有驗證順序，但每組請<b>「從左至右」</b>讀取。若鍵盤沒有順利打開，試著點選<b>在閃爍的游標</b>即可。</p>
    <p>每組驗證碼皆僅能使用一次，重複驗證無效。</p><p>若真的找不齊所有的驗證碼，蹲下來看看房間中央的白色檯子。</p>
    <small>我、我會偷偷寫在那裡!</small>
    <br>
    <button class="submit-button">關閉</button>
  `;

  popup.querySelector("button").onclick = () => {
    document.body.removeChild(overlay);
    enableTerminalInput();
  };

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  
}

function showMorePopup() {
  const overlay = document.createElement("div");
  overlay.className = "overlay";

  const popup = document.createElement("div");
  popup.className = "popup";

  popup.innerHTML = `
    <h3>📄聲明</h3>
    <p>本網頁並不會留存、紀錄任何帳戶名稱以外的資訊(包含密碼)，都僅為一次性資料。</p>
    <p>本作僅是模擬一個常見的免洗帳號，並沒有任何重要的意義，也不能享有折扣......</p>
    <p>但還是請自由的體驗本作品！只要都驗證完了，應該就能進入真正的虛擬世界了吧！若過程有任何不適，關閉網頁離開這裡即可。</p>
    <button class="submit-button">知道了</button>
  `;

  popup.querySelector("button").onclick = () => {
    document.body.removeChild(overlay);
    enableTerminalInput();
  };

  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}
