import { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('users').del();

  // Default admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  await knex('users').insert([
    {
      id: 'user-admin-001',
      username: 'admin',
      email: 'admin@scriptmaster.ai',
      password_hash: adminPassword,
      role: 'ADMIN',
      full_name: 'System Administrator',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ]);

  // Default developer user
  const devPassword = await bcrypt.hash('dev123', 12);
  await knex('users').insert([
    {
      id: 'user-dev-001',
      username: 'developer',
      email: 'dev@scriptmaster.ai',
      password_hash: devPassword,
      role: 'DEVELOPER',
      full_name: 'Demo Developer',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ]);

  // Default artist user
  const artistPassword = await bcrypt.hash('artist123', 12);
  await knex('users').insert([
    {
      id: 'user-artist-001',
      username: 'artist',
      email: 'artist@scriptmaster.ai',
      password_hash: artistPassword,
      role: 'ARTIST',
      full_name: 'Demo Artist',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ]);

  // Default uploader user
  const uploaderPassword = await bcrypt.hash('upload123', 12);
  await knex('users').insert([
    {
      id: 'user-uploader-001',
      username: 'uploader',
      email: 'uploader@scriptmaster.ai',
      password_hash: uploaderPassword,
      role: 'UPLOADER',
      full_name: 'Demo Uploader',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }
  ]);
}