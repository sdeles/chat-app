const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'decision_tree_db',
    password: 'yourpassword',  // Altere para sua senha
    port: 5432,
});

module.exports = pool;
