const fs = require("fs");
const dbFile = "./chat.db"
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let crypto = require("crypto");
let db;

dbWrapper.open({
    filename: dbFile,
    driver: sqlite3.Database
}).then(async dBase => {
    db = dBase;
    try {
        if (!exists) {
            await db.run(
                `CREATE TABLE user (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    login VARCHAR(40) UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    salt TEXT
                )`
            );
            await db.run(
                `CREATE TABLE message (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    datetime VARCHAR(100),
                    author_id INTEGER NOT NULL,
                    FOREIGN KEY (author_id) REFERENCES user(id)
                )`
            )
        } else {
            console.log(await db.all("SELECT * FROM user"));
        }
    } catch (error) {
        console.error(error);
    }
})

module.exports = {
    getMessages: async () => {
        return await db.all(
            `SELECT m.id AS msg_id, a.id AS author_id, m.content AS msg, a.login AS author, m.datetime AS time
            FROM message m 
            JOIN user a ON m.author_id = a.id`
        )
    },
    addMessage: async (msg, userId, dt) => {
        await db.run(
            `INSERT INTO message (content, datetime, author_id) 
            VALUES (?, ?, ?)`, [msg, dt, userId]
        )
    },
    isUserExist: async (user) => {
        let author = await db.all("SELECT * FROM user WHERE login = ?", [user]);
        return author.length;
    },
    addUser: async (user) => {
        let salt = crypto.randomBytes(16).toString("hex");
        let passCipher = crypto.pbkdf2Sync(user.password, salt, 1000, 100, 'sha512').toString("hex");
        await db.run(
            `INSERT INTO user (login, password, salt) VALUES (?, ?, ?)`, 
            [user.login, passCipher, salt]
        )
    },
    getAuthToken: async (user) => {
        let author = await db.all(`SELECT * FROM user WHERE login = ?`, [user.login]);
        if (!author.length) {
            throw "Incorrect login"
        }
        const { id, login, password, salt } = author[0];
        const hash = crypto.pbkdf2Sync(user.password, salt, 1000, 100, 'sha512').toString("hex");
        if (hash != password) {
            throw "Incorrect password"
        }
        return id + "." + login + "." + crypto.randomBytes(20).toString("hex");
    }
}