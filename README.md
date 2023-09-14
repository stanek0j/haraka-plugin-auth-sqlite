[![NPM][npm-img]][npm-url]

# haraka-plugin-auth-sqlite

This plugin uses a SQLite database to store hashed user credentials for authentication. Stored credentials are compatible with [haraka-plugin-auth-enc-file](https://github.com/AuspeXeu/haraka-plugin-auth-enc-file). Currently only SHA512CRYPT is supported.

##Configuration

Configuration is stored in `config/auth_sqlite.ini` and uses the INI style formatting.

Example:

```
db_file=auth.db
```

##Managing users

Simple tool for managing users in database is provided. SHA512-CRYPT hashes are generated automatically as needed. Syntax for the tool is:

`node ./manage.js [command] <args>`

###List users

For listing all users in database, use:

`node ./manage.js list`

###Create user

To add a new user, use:

`node ./manage.js add <username> <password>`

There is no need to retype password. Also, password is stored in hashed form.

###Modify user

To change user password, use:

`node ./manage.js mod <username> <password>`

There is no need to retype new password or to type old password. Also, password is stored in hashed form.

To change the name of the user you have to delete the old user and create a new one.

###Delete user

To delete a user, use:

`node ./manage.js del <username>`

[npm-img]: https://nodei.co/npm/haraka-plugin-auth-sqlite.png
[npm-url]: https://www.npmjs.com/package/haraka-plugin-auth-sqlite
