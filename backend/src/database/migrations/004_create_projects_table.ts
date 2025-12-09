import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('projects', (table) => {
    table.string('id').primary();
    table.string('title').notNullable();
    table.text('description').nullable();
    table.enum('status', ['DRAFT', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).notNullable().defaultTo('DRAFT');
    table.string('created_by').notNullable();
    table.date('start_date').nullable();
    table.date('end_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign key
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index(['title']);
    table.index(['status']);
    table.index(['created_by']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('projects');
}