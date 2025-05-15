const socket = io({
    auth: {
        cookie: document.cookie
    }
});

let c = document.cookie;
let token = c.split("=")[1];
let userId = token.split(".")[0];
let username = token.split(".")[1];
alert(`Welcome, ${username}`)
const toggleThemeBtn = document.querySelector("#toggle-theme");
toggleThemeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    toggleThemeBtn.textContent = document.body.classList.contains("dark") ? '☀️' : '🌙';
})

let form = document.querySelector("#form");
form.addEventListener("submit", event => {
    event.preventDefault();
    socket.emit("new_message", event.target["msg"].value);
    event.target["msg"].value = ""
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
    `
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
    })
})

document.querySelector(".exit").addEventListener("click", () => {
    document.cookie = 'token=; Max-Age=0';
    location.assign("/auth");
})