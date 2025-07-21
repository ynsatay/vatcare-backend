import connection from "../../knex/connection.js";

async function logFeed({ user_id = null, title, icon = "bi bi-info-circle", color = "primary", feed_date = null,  reference_table = null,
  reference_id = null, }) {
  try {
    await connection("feeds").insert({
      user_id,
      title,
      icon,
      color,
      feed_date,
      reference_table,
      reference_id,
    });
  } catch (error) {
    console.error("Feed loglama hatası:", error.message);
  }
}

export default logFeed;
