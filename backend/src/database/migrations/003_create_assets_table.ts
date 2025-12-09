import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('assets', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.enum('type', ['IMAGE', 'AUDIO', 'VIDEO', 'ANIMATION', 'COMPONENT']).notNullable();
    table.text('description').notNullable();
    table.string('dimensions').nullable();
    table.string('format').nullable();
    table.text('upload_instructions').notNullable();
    table.enum('status', ['PENDING', 'READY', 'UPLOADED', 'APPROVED']).notNullable().defaultTo('PENDING');
    table.string('file_path').nullable();
    table.integer('file_size').nullable();
    table.string('template_id').nullable();
    table.string('segment_id').nullable();
    table.string('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('template_id').references('id').inTable('templates').onDelete('CASCADE');
    table.foreign('segment_id').references('id').inTable('segments').onDelete('CASCADE');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');

    // Indexes
    table.index(['name']);
    table.index(['type']);
    table.index(['status']);
    table.index(['template_id']);
    table.index(['segment_id']);
    table.index(['created_by']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('assets');
}