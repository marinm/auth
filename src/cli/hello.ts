import dotenv from "dotenv";
import * as database from "@/database/database";
import * as users from "@/database/users";
import * as sessions from "@/database/sessions";
import * as auth from "@/auth/auth";

dotenv.config();

function main(): void {
    const [, , command, ...args] = process.argv;

    switch (command) {
        case "run":
            database.run(args[0]);
            break;
        case "all":
            database.all(args[0]);
            break;
        case "tables":
            database.tables();
            break;
        case "tableInfo":
            database.tableInfo(args[0]);
            break;
        case "drop":
            database.drop(args[0]);
            break;
        case "createUsersTable":
            users.createTable();
            break;
        case "createUser":
            users.create(args[0], args[1]);
            break;
        case "users":
            users.all();
            break;
        case "usernameExists":
            users.usernameExists(args[0]);
            break;
        case "getUserById":
            users.byId(args[0]);
            break;
        case "getUserByUsername":
            users.byUsername(args[0]);
            break;
        case "signIn":
            auth.signIn(args[0], args[1]);
            break;
        case "createSessionsTable":
            sessions.createTable();
            break;
        case "createSession":
            sessions.create(args[0]);
            break;
        case "sessions":
            sessions.all();
            break;
        case "authenticateSession":
            sessions.authenticate(args[0]);
            break;
        case "refreshSession":
            sessions.refresh(args[0]);
            break;
        case "deleteSession":
            sessions.del(args[0]);
            break;
        case "signOut":
            auth.signOut(args[0]);
            break;
        default:
            console.error("Command does not exist");
    }
}

main();
