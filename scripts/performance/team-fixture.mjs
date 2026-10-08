// Ephemeral PGlite only. The home team section is prerendered, so these same
// identities must exist both when compiling the dedicated fixture and serving it.
export async function seedTeamFixture(db) {
  for (let index = 0; index < 2; index++) {
    const id = `local-team-user-${index}`;
    await db.query('INSERT INTO "User" (id,name,email,email_verified,"createdAt","updatedAt",username) VALUES ($1,$2,$3,false,$4,$4,$5)',
      [id, `Local Team ${index + 1}`, `local-team-${index}@example.test`, "2026-01-01T00:00:00Z", `local_team_${index}`]);
    await db.query('INSERT INTO "TeamMember" (id,"userId",name,"roleTitle","createdById","updatedAt") VALUES ($1,$2,$3,$4,$2,now())',
      [`local-team-${index}`, id, `Local Team ${index + 1}`, `Local role ${index + 1}`]);
    if (index === 1) {
      for (const preset of ["BRONZE_FRAME", "AURORA_ACCENT", "VIOLET_NAMEPLATE"]) {
        const result = await db.query('SELECT id,type FROM "Cosmetic" WHERE "visualPreset"=$1 ORDER BY id LIMIT 1', [preset]);
        const cosmetic = result.rows[0];
        if (!cosmetic) throw new Error(`Missing isolated team cosmetic: ${preset}`);
        await db.query('INSERT INTO "UserCosmetic" (user_id,cosmetic_id,source) VALUES ($1,$2,\'PURCHASE\')', [id, cosmetic.id]);
        await db.query('INSERT INTO "EquippedCosmetic" (user_id,type,cosmetic_id,updated_at) VALUES ($1,$2,$3,now())', [id, cosmetic.type, cosmetic.id]);
      }
    }
  }
}
