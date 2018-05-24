const output = document.getElementById("terminal-output");
const input = document.getElementById("terminal-input");
const terminal = document.getElementById("terminal");
const cursor = document.getElementById("cursor");

const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const test = document.getElementById("Test");
test.innerText = alphabet;
const charWidth = (test.clientWidth + 1) / alphabet.length + 0.25;

function handleInput(input) {
  const output = eval(input);
  return `${output}`;
}

terminal.addEventListener("click", () => {
  setTimeout(() => {
    input.focus();
  }, 0);
});

let adjustment = 0;

input.addEventListener("keydown", e => {
  if (e.keyCode === 13) {
    let inputText = input.innerText;
    let outputText;
    let inputElement = document.createElement("div");
    inputElement.className = "input-str";
    let outputElement = document.createElement("div");
    try {
      outputText = handleInput(inputText);
    } catch (e) {
      outputText = e;
      outputElement.className = "error";
    }
    outputElement.innerText = outputText;
    inputElement.innerText = inputText;
    output.appendChild(inputElement);
    if (outputText) {
      output.appendChild(outputElement);
    }
    input.innerHTML = "";
    e.preventDefault();
    realignCursor();
  } else if (e.keyCode === 37) {
    adjustment--;
    realignCursor();
  } else if (e.keyCode === 39) {
    adjustment++;
    realignCursor();
  }
});

input.addEventListener("input", () => {
  realignCursor();
});

function realignCursor() {
  let offsetLeft = input.offsetLeft;
  let innerText = `${input.innerText}`;
  let inputLen = (innerText.length + adjustment) * charWidth;
  inputLen = inputLen >= 0 ? inputLen : 0;
  cursor.style.left = `calc(calc(${offsetLeft}px + 1.4rem) + ${inputLen}px)`;
  cursor.style.top = `${input.offsetTop}px`;
}

realignCursor();
