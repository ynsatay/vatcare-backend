import connection from "../../knex/connection.js";

function pad2(n) { return n.toString().padStart(2, '0'); }
function toLocalSql(val) {
  if (!val) {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }
  if (typeof val === 'string') {
    if (val.includes('T')) {
      const d = new Date(val);
      return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
    }
    return val; // zaten SQL formatında string
  }
  if (val instanceof Date) {
    const d = val;
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }
  return val;
}

async function logFeed({  user_id = null,
                          title,
                          icon = "bi bi-info-circle",
                          color = "primary",
                          feed_date = null,
                          reference_table = null,
                          reference_id = null,
                          off_id = null }) {
  try {
    const fmtFeed = toLocalSql(feed_date);
    await connection("feeds").insert({
      user_id,
      title,
      icon,
      color,
      feed_date: fmtFeed,
      reference_table,
      reference_id,
      off_id
    });
  } catch (error) {
    console.error("Feed loglama hatası:", error.message);
  }
}

export default logFeed;
