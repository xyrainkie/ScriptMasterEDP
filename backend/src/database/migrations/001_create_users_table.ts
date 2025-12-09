import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('username').unique().notNullable();
    table.string('email').unique().notNullable();
    table.string('password_hash').notNullable();
    table.enum('role', ['DEVELOPER', 'ARTIST', 'UPLOADER', 'ADMIN']).notNullable().defaultTo('DEVELOPER');
    table.string('full_name').notNullable();
    table.string('avatar_url').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.timestamp('last_login').nullable();

    // Indexes
    table.index(['email']);
    table.index(['username']);
    table.index(['role']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}