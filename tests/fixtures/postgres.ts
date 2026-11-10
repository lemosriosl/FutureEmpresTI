import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { PostgreSqlContainer } from '@testcontainers/postgresql';

export async function testPostgres(auth: 'fixture' | 'gotrue' = 'fixture') {
  const root = new URL('../../prisma/migrations/', import.meta.url);
  const directories = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const migrations = await Promise.all(directories.map((name) =>
    readFile(new URL(`${name}/migration.sql`, root), 'utf8')));
  const setup = [
    'CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;',
    'CREATE SCHEMA auth;',
    auth === 'fixture'
      ? 'CREATE TABLE auth.users (id uuid PRIMARY KEY, email text NOT NULL, email_confirmed_at timestamptz);'
      : '',
    ...migrations,
    'GRANT USAGE ON SCHEMA public TO authenticated;',
    'GRANT SELECT ON tenants, memberships, equipment, loans, audit_logs TO authenticated;',
    'GRANT INSERT ON loans, audit_logs TO authenticated;',
  ].join('\n');
  return new PostgreSqlContainer('postgres:16-alpine')
    .withUsername('postgres')
    .withPassword(randomUUID())
    .withCopyContentToContainer([{ content: setup, target: '/docker-entrypoint-initdb.d/01-empres-ti.sql' }]);
}
