import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('segments', (table) => {
    table.string('id').primary();
    table.string('title').notNullable();
    table.string('template_id').notNullable();
    table.string('project_id').notNullable();
    table.integer('order_index').notNullable();
    table.text('content').nullable();
    table.text('notes').nullable();
    table.string('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('template_id').references('id').inTable('templates').onDelete('CASCADE');
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index(['project_id']);
    table.index(['template_id']);
    table.index(['order_index']);
    table.index(['created_by']);

    // Unique constraint for order within a project
    table.unique(['project_id', 'order_index']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('segments');
}