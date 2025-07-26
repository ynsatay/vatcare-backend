import connection from "../../knex/connection.js";

export async function deleteFeedWithReference(feedId, off_id) {
  // Feed kaydını off_id ile birlikte alıyoruz
  const feed = await connection("feeds")
    .where({ id: feedId, off_id })
    .first();

  if (!feed) {
    throw new Error("Feed kaydı bulunamadı veya yetkiniz yok");
  }

  if (feed.reference_table && feed.reference_id) {
    // Referans tabloya da off_id filtresi ekliyoruz
    await connection(feed.reference_table)
      .where({ id: feed.reference_id, off_id })
      .del();
  }

  await connection("feeds").where({ id: feedId, off_id }).del();
}
