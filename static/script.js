const socket = io({
    auth: {
        cookie: document.cookie
    }
});
const textarea = document.querySelector("#msg");
let c = document.cookie;
let token = c.split("=")[1];
let userId = token.split(".")[0];
let username = token.split(".")[1];
alertify.log(`Welcome, ${username}`);
let theme = localStorage.getItem("theme");
const toggleThemeBtn = document.querySelector("#toggle-theme");
if (theme == "dark") {
    document.body.classList.add("dark");
    toggleThemeBtn.textContent = document.body.classList.contains("dark") ? '☀️' : '🌙';
}

toggleThemeBtn.addEventListener("click", () => {
    let isDark = document.body.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "");
    toggleThemeBtn.textContent = document.body.classList.contains("dark") ? '☀️' : '🌙';
})

let form = document.querySelector("#form");
form.addEventListener("submit", event => {
    event.preventDefault();
    if (event.target["msg"].value.trim() == "") {
        event.target["msg"].value = "";
        textarea.style.height = "initial";
        return
    }
    socket.emit("new_message", event.target["msg"].value.trim());
    event.target["msg"].value = "";
    textarea.style.height = "initial";
})
let messagesDOM = document.querySelector("#messages");
socket.on("message", msg => {
    let obj = JSON.parse(msg);
    let align = "right";
    let avatarDOM = "";
    let senderDOM = "";
    let letter = obj.sender.charAt(0);
    if (userId != obj.userId) {
        align = "left";
        avatarDOM = `<div class="avatar">${letter}</div>`;
        senderDOM = `<span class="sender">${obj.sender}</span>`
    }

    messagesDOM.innerHTML += `
        <li class="${align}">
            ${avatarDOM}
            <div class="message">
                ${senderDOM}
                <span class="text">${obj.text}</span>
                <span class="time">${obj.time}</span>
            </div>
        </li>
    `;
    messagesDOM.scrollTo(0, messagesDOM.scrollHeight);
})

socket.on("all_messages", msgArray => {
    msgArray.forEach(item => {
        let align = "right";
        let avatarDOM = "";
        let letter = item.author.charAt(0);
        let senderDOM = "";
        if (userId != item.author_id) {
            align = "left";
            avatarDOM = `<div class="avatar">${letter}</div>`;
            senderDOM = `<span class="sender">${item.author}</span>`
        }
        messagesDOM.innerHTML += `
            <li class="${align}">
                ${avatarDOM}
                <div class="message">
                    ${senderDOM}
                    <span class="text">${item.msg}</span>
                    <span class="time">${item.time}</span>
                </div>
            </li>
        `
    });
    messagesDOM.scrollTo(0, messagesDOM.scrollHeight);
})

document.querySelector(".exit").addEventListener("click", () => {
    document.cookie = 'token=; Max-Age=0';
    location.assign("/auth");
})

textarea.addEventListener("keydown", e => {
    if (e.key == "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.dispatchEvent(new Event("submit"));
    }
})

textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
})
