const sha512crypt = require('sha512crypt-node').sha512crypt;
const sqlite3 = require('better-sqlite3');

exports.hook_capabilities = function (next, connection) {
    // Don't offer AUTH capabilities by default unless session is encrypted
    if (connection.tls.enabled) {
        const methods = ['PLAIN', 'LOGIN'];
        connection.capabilities.push(`AUTH ${methods.join(' ')}`);
        connection.notes.allowed_auth_methods = methods;
    }
    next();
}

exports.register = function () {
    this.inherits('auth/auth_base');
    this.load_auth_sqlite_ini();
}

exports.load_auth_sqlite_ini = function () {
    this.cfg = this.config.get('auth_sqlite.ini', this.load_auth_sqlite_ini);
}

exports.check_plain_passwd = function (connection, user, passwd, cb) {
    const dbName = this.cfg.main.db_file || 'auth.db';

    try {
        const db = new sqlite3(dbName, { readonly: true, fileMustExist: true });
        const create = db.prepare("CREATE TABLE IF NOT EXISTS users (username TEXT NOT NULL UNIQUE, password TEXT NOT NULL, PRIMARY KEY(username)) WITHOUT ROWID");
        const select = db.prepare("SELECT password FROM users WHERE username=?");

        create.run();
        const dbUser = select.get(user);
        if (dbUser) {
            const [ , id, salt, hash] = dbUser.password.split('$');
            return cb(sha512crypt(passwd, salt) === `$${id}$${salt}$${hash}`);
        }
    }
    catch (err) {
        this.logerror(`Unexpected error: ${err.message}`);
    }

    return cb(false);
}
