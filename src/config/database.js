const { Pool, types } = require('pg');

// BIGINT / BIGSERIAL (y COUNT) llegan como texto desde PostgreSQL; se convierten a número.
types.setTypeParser(20, (value) => parseInt(value, 10));

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'autos_colombia',
  max: 10
});

// Los repositorios escriben consultas con "?" y esperan [filas] o [{ insertId, affectedRows }].

function toPostgres(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function run(executor, sql, params = []) {
  const isInsert = /^\s*INSERT/i.test(sql);
  const isSelect = /^\s*(SELECT|WITH)/i.test(sql);
  let text = toPostgres(sql);
  if (isInsert && !/RETURNING/i.test(text)) text += ' RETURNING id';
  try {
    const result = await executor.query(text, params);
    if (isSelect) return [result.rows];
    return [{ affectedRows: result.rowCount, insertId: isInsert ? result.rows[0]?.id : undefined }];
  } catch (err) {
    if (err.code === '23505') err.code = 'ER_DUP_ENTRY'; // violación de UNIQUE
    throw err;
  }
}

async function getConnection() {
  const client = await pool.connect();
  return {
    execute: (sql, params) => run(client, sql, params),
    query: (sql, params) => run(client, sql, params),
    beginTransaction: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    release: () => client.release()
  };
}

module.exports = {
  execute: (sql, params) => run(pool, sql, params),
  query: (sql, params) => run(pool, sql, params),
  getConnection,
  end: () => pool.end()
};
