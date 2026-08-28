const mysql = require('mysql2/promise');

// MySQLの接続情報
const pool = mysql.createPool({
  host: 'localhost',
  port: 8889,        // MAMPのデフォルトポートは 8889
  user: 'root',
  password: 'root',  // MAMPのデフォルトパスワードは root
  database: 'nodejs_db_kadai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// SQL文を実行する非同期関数
async function executeQuery(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// DB接続プールを安全に閉じる関数
async function closePool() {
  await pool.end();
}

module.exports = {
  executeQuery,
  closePool
};