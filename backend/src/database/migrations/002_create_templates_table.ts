import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('templates', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.string('category').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.string('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index(['name']);
    table.index(['category']);
    table.index(['created_by']);
    table.index(['is_active']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('templates');
}