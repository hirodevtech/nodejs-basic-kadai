const express = require('express');
const { executeQuery, closePool } = require('./db');

const app = express();
const PORT = 3000;

// JSON形式のリクエストボディを解析するミドルウェア
app.use(express.json());

// 共通サーバーエラーハンドラー
function handleServerError(res, error) {
  console.error('Server Error:', error);
  return res.status(500).json({ error: 'Internal Server Error' });
}

/**
 * [POST] /todos
 * ToDoの作成
 */
app.post('/todos', async (req, res) => {
  const { title, priority } = req.body;

  try {
    const sql = 'INSERT INTO todos (title, priority) VALUES (?, ?)';
    const result = await executeQuery(sql, [title, priority || '中']);

    // 作成成功時 (201 Created)
    res.status(201).json({
      id: result.insertId,
      title: title,
      priority: priority || '中',
      status: '未着手'
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

/**
 * [GET] /todos
 * 全ToDoの取得
 */
app.get('/todos', async (req, res) => {
  try {
    const sql = 'SELECT * FROM todos';
    const todos = await executeQuery(sql);

    // 成功時 (200 OK)
    res.status(200).json(todos);
  } catch (error) {
    handleServerError(res, error);
  }
});

/**
 * [PUT] /todos/:id
 * 指定IDのToDo更新
 */
app.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, priority, status } = req.body;

  try {
    const updateSql = 'UPDATE todos SET title = ?, priority = ?, status = ? WHERE id = ?';
    const result = await executeQuery(updateSql, [title, priority, status, id]);

    // 該当するIDが存在しない場合 (404 Not Found)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ToDo not found' });
    }

    // 更新成功時 (200 OK)
    res.status(200).json({
      id: Number(id),
      title: title,
      priority: priority,
      status: status
    });
  } catch (error) {
    handleServerError(res, error);
  }
});

/**
 * [DELETE] /todos/:id
 * 指定IDのToDo削除
 */
app.delete('/todos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deleteSql = 'DELETE FROM todos WHERE id = ?';
    const result = await executeQuery(deleteSql, [id]);

    // 該当するIDが存在しない場合 (404 Not Found)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ToDo not found' });
    }

    // 削除成功時 (200 OK)
    res.status(200).json({ message: 'ToDo deleted successfully' });
  } catch (error) {
    handleServerError(res, error);
  }
});

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// アプリ終了時にDB接続プールを安全に閉じる処理
async function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Closing HTTP server and DB connection pool...`);
  server.close(async () => {
    try {
      await closePool();
      console.log('DB pool closed. Process exiting.');
      process.exit(0);
    } catch (err) {
      console.error('Error during pool closing:', err);
      process.exit(1);
    }
  });
}

// SIGINT, SIGTERM, SIGHUP シグナルに対応
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach((signal) => {
  process.on(signal, () => gracefulShutdown(signal));
});