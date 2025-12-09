import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('export_history', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable();
    table.enum('export_type', ['DEVELOPER', 'ARTIST', 'UPLOADER']).notNullable();
    table.string('file_path').notNullable();
    table.string('file_name').notNullable();
    table.integer('file_size').notNullable();
    table.string('exported_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('project_id').references('id').inTable('projects').onDelete('CASCADE');
    table.foreign('exported_by').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index(['project_id']);
    table.index(['export_type']);
    table.index(['exported_by']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('export_history');
}