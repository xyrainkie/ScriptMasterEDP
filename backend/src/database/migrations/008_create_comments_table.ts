import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('comments', (table) => {
    table.string('id').primary();
    table.text('content').notNullable();
    table.string('author_id').notNullable();
    table.enum('target_type', ['PROJECT', 'SEGMENT', 'ASSET']).notNullable();
    table.string('target_id').notNullable();
    table.string('parent_id').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('author_id').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('parent_id').references('id').inTable('comments').onDelete('CASCADE');

    // Indexes
    table.index(['author_id']);
    table.index(['target_type']);
    table.index(['target_id']);
    table.index(['parent_id']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('comments');
}