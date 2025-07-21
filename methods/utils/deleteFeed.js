import connection from "../../knex/connection.js";

export async function deleteFeedWithReference(feedId) {
  const feed = await connection("feeds").where({ id: feedId }).first();

  if (!feed) {
    throw new Error("Feed kaydı bulunamadı");
  }

  if (feed.reference_table && feed.reference_id) {
    await connection(feed.reference_table)
      .where({ id: feed.reference_id })
      .del();
  }

  await connection("feeds").where({ id: feedId }).del();
}