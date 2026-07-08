import { query } from "./_generated/server";

export default query({
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users.map(u => ({ id: u._id, name: u.name, borders: u.equippedBorder }));
  }
});
