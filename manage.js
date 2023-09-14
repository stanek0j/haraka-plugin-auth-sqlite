#!/usr/bin/env node

const yargs = require('yargs');
const crypto = require('crypto');
const sha512crypt = require('sha512crypt-node').sha512crypt;
const sqlite3 = require('better-sqlite3');
const harakaConfig = require('haraka-config');

const config = harakaConfig.get('auth_sqlite.ini');
const dbName = config.main.db_file || 'auth.db';
const db = new sqlite3(dbName);
process.on('exit', () => db.close());

const create = db.prepare("CREATE TABLE IF NOT EXISTS users (username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, PRIMARY KEY(username)) WITHOUT ROWID");
create.run();

const select = db.prepare("SELECT username from users");
const single = db.prepare("SELECT COUNT(*) AS count FROM users WHERE username=?");
const insert = db.prepare("INSERT INTO users VALUES (?,?)");
const update = db.prepare("UPDATE users SET password=? WHERE username=?");
const remove = db.prepare("DELETE FROM users WHERE username=?");

function listUsers () {
    return select.all();
}

function hasUser (username) {
    const row = single.get(username);
    return row.count;
}

function addUser (username, password) {
    return insert.run(username, password);
}

function modUser (username, password) {
    return update.run(password, username);
}

function delUser (username) {
    return remove.run(username);
}

function generateRandomString (length) {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

function hashPassword (password) {
    const salt = generateRandomString(16);
    const hash = sha512crypt(password, salt);
    return `{SHA512-CRYPT}${hash}`;
}

yargs
    .usage("Usage: $0 [cmd] <args>").alias("h", "help")
    .command(
        'list',
        'list all users in database',
        (args) => {},
        (argv) => {
            try {
                const rows = listUsers();
                console.log('List of users:');
                rows.forEach(user => {
                    console.log(`  ${user.username}`);
                });
            }
            catch (err) {
                console.error(`Unexpected error: ${err.message}`);
            }
        })
    .command(
        'add <username> <password>',
        'add user to database',
        (args) => {
            args.positional('username', {
                describe: 'name of the user',
                type: 'string',
                demandOption: true
            });
            args.positional('password', {
                describe: 'password for the user',
                type: 'string',
                demandOption: true
            });
        },
        (argv) => {
            try {
                if (!hasUser(argv.username)) {
                    addUser(argv.username, hashPassword(argv.password));
                    console.log(`User "${argv.username}" created.`);
                }
                else {
                    console.log(`User "${argv.username}" already exists.`);
                }
            }
            catch (err) {
                console.error(`Unexpected error: ${err.message}`);
            }
        })
    .command(
        'mod <username> <password>',
        'modify user in database',
        (args) => {
            args.positional('username', {
                describe: 'name of the user',
                type: 'string',
                demandOption: true
            });
            args.positional('password', {
                describe: 'password for the user',
                type: 'string',
                demandOption: true
            });
        },
        (argv) => {
            try {
                if (hasUser(argv.username)) {
                    modUser(argv.username, hashPassword(argv.password));
                    console.log(`User "${argv.username}" modified.`);
                }
                else {
                    console.log(`User "${argv.username}" does not exist.`);
                }
            }
            catch (err) {
                console.error(`Unexpected error: ${err.message}`);
            }
        })
    .command(
        'del <username>',
        'delete user from database',
        (args) => {
            args.positional('username', {
                describe: 'name of the user',
                type: 'string',
                demandOption: true
            });
        },
        (argv) => {
            try {
                if (hasUser(argv.username)) {
                    delUser(argv.username);
                    console.log(`User "${argv.username}" deleted.`);
                }
                else {
                    console.log(`User "${argv.username}" does not exist.`);
                }
            }
            catch (err) {
                console.error(`Unexpected error: ${err.message}`);
            }
        })
    .help().demandCommand().argv;

