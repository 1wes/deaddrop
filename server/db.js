const mysql = require('mysql');

const { db_name, db_password, db_host, db_username } = require('./env-config');

const dbInstance = mysql.createConnection({
    host: db_host,
    user: db_username,
    password: db_password,
    database: db_name
});

dbInstance.connect(err => {
    
    if (err) {
        console.log(err)
    } else {
        console.log("Successful database connection");
    }
});

module.exports = dbInstance;