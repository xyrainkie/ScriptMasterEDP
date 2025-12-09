import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('course_preset_steps', (table) => {
    table.string('id').primary();
    table.string('title').notNullable();
    table.string('template_id').notNullable();
    table.string('preset_id').notNullable();
    table.integer('order_index').notNullable();

    // Foreign keys
    table.foreign('template_id').references('id').inTable('templates').onDelete('CASCADE');
    table.foreign('preset_id').references('id').inTable('course_presets').onDelete('CASCADE');

    // Indexes
    table.index(['preset_id']);
    table.index(['template_id']);
    table.index(['order_index']);

    // Unique constraint for order within a preset
    table.unique(['preset_id', 'order_index']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('course_preset_steps');
}