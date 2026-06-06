---
description: 'Scaffold a new Drizzle database migration for The Collective Hub. Generates schema additions in schema.ts and runs drizzle-kit generate to produce the SQL migration.'
agent: 'agent'
---

Generate a Drizzle database migration for: ${input}

Follow all conventions in:
- [database-schema.instructions.md](.github/instructions/database-schema.instructions.md)
- [multi-tenant-architecture.instructions.md](.github/instructions/multi-tenant-architecture.instructions.md)

## Rules

1. **Additive changes only** — never add destructive operations (ALTER DROP, RENAME) in a production migration
2. **Every new table must have a `siteId` column** — references `sites.id` with `onDelete: 'cascade'`
3. **Every new table must have:**
   - `id: uuid('id').defaultRandom().primaryKey()`
   - `createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()`
   - `updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date())`
4. **Use snake_case for column names** in the database
5. **Add indexes** on `siteId` and any commonly filtered columns
6. **Use appropriate types:** `text`, `boolean`, `integer`, `jsonb`, `timestamp`

## Steps

1. Add the new table/column definition to [`src/lib/server/db/schema.ts`](src/lib/server/db/schema.ts)
2. Run `npx drizzle-kit generate` to create the SQL migration file
3. Review the generated SQL in `drizzle/` to ensure it matches expectations

## Example: New Table

```ts
// In schema.ts
export const newTable = pgTable(
    'new_table',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        siteId: uuid('site_id')
            .notNull()
            .references(() => sites.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        isActive: boolean('is_active').notNull().default(true),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true })
            .notNull()
            .defaultNow()
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index('new_table_site_id_idx').on(table.siteId),
    ]
);
```

## Example: New Column

```ts
// Add to an existing table definition
export const events = pgTable('events', {
    // ... existing columns
    newColumn: text('new_column'),  // Add new optional column
});
```
