import Database from "better-sqlite3";
import crypto from "node:crypto";
import * as uuid from "uuid";

function run(statement: string, params: unknown): void {
    console.time("db:connect");
    const db = new Database(process.env.DATABASE_URL);
    db.pragma("journal_mode = WAL");
    console.timeEnd("db:connect");

    console.time("db:run");
    const prepared = db.prepare(statement);
    const result = prepared.run(params);
    console.timeEnd("db:run");

    console.log(result);

    db.close();
}

function get<T>(statement: string, params: unknown): undefined | T {
    console.time("db:connect");
    const db = new Database(process.env.DATABASE_URL);
    db.pragma("journal_mode = WAL");
    console.timeEnd("db:connect");

    console.time("db:run");
    const prepared = db.prepare(statement);
    const result = prepared.get(params) as T;
    console.timeEnd("db:run");

    console.log(result);

    db.close();

    return result;
}

function all<T>(statement: string): T[] {
    console.time("db:connect");
    const db = new Database(process.env.DATABASE_URL);
    db.pragma("journal_mode = WAL");
    console.timeEnd("db:connect");

    console.time("db:run");
    const prepared = db.prepare(statement);
    const result = prepared.all() as T[];
    console.timeEnd("db:run");

    console.log(result);

    db.close();

    return result;
}

export function tables(): void {
    all("SELECT * FROM sqlite_master");
}

export function drop(table: string): void {
    run(`DROP TABLE IF EXISTS ?`, [table]);
}

export function randomHex(n: number): string {
    console.time("randomHex");
    const result: string = crypto.randomBytes(n).toString("hex");
    console.timeEnd("randomHex");
    console.log(result);
    return result;
}

export function hashedPassword(password: string): string {
    const salt = randomHex(16);
    console.time("crypto.scryptSync");
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    console.timeEnd("crypto.scryptSync");
    console.log(password, salt, hash);
    return `${salt}-${hash}`;
}

export function uuidv4(): string {
    console.time("uuid:v4");
    const result = uuid.v4();
    console.timeEnd("uuid:v4");
    console.log("uuid:v4: " + result);
    return result;
}

export function now(): string {
    const datetime = new Date();

    const y = datetime.getUTCFullYear();
    const m = String(datetime.getUTCMonth()).padStart(2, "0");
    const d = String(datetime.getUTCDate()).padStart(2, "0");
    const h = String(datetime.getUTCHours()).padStart(2, "0");
    const i = String(datetime.getUTCMinutes()).padStart(2, "0");
    const s = String(datetime.getUTCSeconds()).padStart(2, "0");

    const result = `${y}-${m}-${d} ${h}:${i}:${s}`;

    console.log("now: " + result);
    return result;
}

export function createUsersTable(): void {
    run(
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );`,
        []
    );
}

export function usernameExists(username: string): boolean {
    return (
        get(`SELECT 1 FROM users WHERE username = ?`, username) !== undefined
    );
}

export type User = {
    id: string;
    username: string;
    password: string;
    created_at: string;
    updated_at: string;
};

export function users(): User[] {
    return all<User>(`SELECT * FROM users`);
}

export function createUser(username: string, password: string): void {
    if (username.length < 2) {
        throw new Error("Username must be at least 2 characters long");
    }

    if (username.length > 32) {
        throw new Error("Username must be at most 32 characters long");
    }

    if (password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
    }

    if (password.length > 32) {
        throw new Error("Password must be at most 32 characters long");
    }

    if (usernameExists(username)) {
        throw new Error(`Username ${username} already exists`);
    }

    const timestamp = now();
    run(`INSERT INTO users VALUES (?, ?, ?, ?, ?);`, [
        uuidv4(),
        username,
        hashedPassword(password),
        timestamp,
        timestamp,
    ]);
}

export function getUserByUsername(username: string): undefined | User {
    return get<User>(`SELECT * FROM users WHERE username = ?;`, username);
}

export function passwordsMatch(
    proof: string,
    salt: string,
    hash: string
): boolean {
    const proofHash = crypto.scryptSync(proof, salt, 64).toString("hex");

    return crypto.timingSafeEqual(
        Buffer.from(proofHash, "hex"),
        Buffer.from(hash, "hex")
    );
}

export function signIn(username: string, password: string): boolean {
    const user = getUserByUsername(username);

    if (!user) {
        throw new Error("That username does not exist");
    }

    const [salt, hash] = user.password.split("-");
    const authenticated = passwordsMatch(password, salt, hash);

    console.log("authenticated: " + (authenticated ? "yes" : "no"));

    return authenticated;
}
