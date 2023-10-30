require('dotenv').config();

const { PORT, DB_USERNAME, DB_HOST, DB_PASSWORD, DB_NAME } = process.env;

module.exports = {
    port: PORT,
    db_username: DB_USERNAME,
    db_host: DB_HOST,
    db_password: DB_PASSWORD,
    db_name:DB_NAME
}