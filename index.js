let http = require("http");
let fs = require("fs");
let path = require("path");
const db = require("./database");
const cookie = require("cookie");

let indexHtmlFile = fs.readFileSync(path.join(__dirname, "static", "index.html"));
let styleFile = fs.readFileSync(path.join(__dirname, "static", "style.css"));
let scriptFile = fs.readFileSync(path.join(__dirname, "static", "script.js"));
let authHtmlFile = fs.readFileSync(path.join(__dirname, "static", "auth.html"));
let authJsFile = fs.readFileSync(path.join(__dirname, "static", "auth.js"));
const validateAuthTokens = [];
const server = http.createServer((req, res) => {
    if (req.method == "GET") {
        switch (req.url) {
            case "/auth": return res.end(authHtmlFile);
            case "/auth.js": return res.end(authJsFile);
            default: return guarded(req, res);
        }
    }
    if (req.method == "POST") {
        switch (req.url) {
            case "/api/register": return registerUser(req, res);
            case "/api/login": return loginUser(req, res);
            default: return guarded(req, res);
        }
    }
})

function registerUser(req, res) {
    let data = "";
    req.on("data", chunk => {
        data += chunk;
    })
    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            if (!user.login || !user.password) {
                res.statusCode = 400;
                return res.end(JSON.stringify({
                    "error": "Empty username or password"
                }))
            }
            if (await db.isUserExist(user.login)) {
                res.statusCode = 400;
                return res.end(JSON.stringify({
                    "error": "User already exists"
                }))
            }
            await db.addUser(user);
            res.statusCode = 201;
            res.end(JSON.stringify({
                "response": "ok"
            }));
        } catch (e) {
            res.statusCode = 500;
            return res.end(JSON.stringify({
                error: e
            }))
        }
    })
}

function loginUser(req, res) {
    let data = "";
    req.on("data", chunk => {
        data += chunk;
    })
    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            const token = await db.getAuthToken(user);
            res.statusCode = 200;
            validateAuthTokens.push(token);
            res.end(JSON.stringify({
                "token": token
            }))
        } catch (e) {
            res.statusCode = 401;
            return res.end(JSON.stringify({
                error: e
            }))
        }
    })
}

function getCredentials(c = "") {
    const cookies = cookie.parse(c);
    const token = cookies?.token;
    if (!token || !validateAuthTokens.includes(token)) return null;
    const [user_id, login] = token.split(".")
    if (!user_id || !login) return null;
    return { user_id, login }
}

function guarded(req, res) {
    const creds = getCredentials(req.headers?.cookie);
    if (!creds) {
        res.writeHead(302, { "Location": "/auth" })
        return res.end();
    }
    if (req.method == "GET") {
        switch (req.url) {
            case "/": return res.end(indexHtmlFile);
            case "/style.css": return res.end(styleFile);
            case "/script.js": return res.end(scriptFile);
        }
    }
    res.statusCode = 404;
    return res.end("Error 404");
}

server.listen(3000);

const { Server } = require("socket.io");
const io = new Server(server);

io.use((socket, next) => {
    const cookie = socket.handshake.auth.cookie;
    const creds = getCredentials(cookie);
    if (!creds) {
        next(new Error("no auth"));
    }
    socket.credentials = creds;
    next();
})

io.on("connection", async (socket) => {
    console.log("A user connected. Id: " + socket.id);

    let login = socket.credentials?.login;
    let userId = socket.credentials?.user_id;
    let messages = await db.getMessages();
    socket.emit("all_messages", messages);
    socket.on("new_message", message => {
        let now = new Date();
        let hours = String(now.getHours()).padStart(2, "0");
        let minutes = String(now.getMinutes()).padStart(2, "0");
        let time = hours + ":" + minutes;
        db.addMessage(message, userId, time);
        io.emit("message", JSON.stringify({
            "sender": login,
            "text": message,
            "time": time,
            "userId": userId
        }))
    })
})