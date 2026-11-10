import { spawn } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { createServer, request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { GenericContainer, Network, Wait } from 'testcontainers';
import { linkEntrega3Professor, loadEntrega3Catalog } from '../../prisma/entrega3';
import { testPostgres } from '../fixtures/postgres';

const appOrigin = 'http://127.0.0.1:3131';
const email = 'colaborador@example.test';
const authPath = '/auth/v1';
const photoPath = /^\/storage\/v1\/object\/public\/catalogo-equipamentos\/equipamentos\/([\da-f-]{36})\.jpg$/;

function jwt(secret: string, role: string) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const claims = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role, exp: Math.floor(Date.now() / 1000) + 3600 })}`;
  return `${claims}.${createHmac('sha256', secret).update(claims).digest('base64url')}`;
}

async function main() {
  const password = process.env.CATALOGO_TEST_PASSWORD;
  if (!password) throw new Error('Execute a configuração Playwright do catálogo.');
  const secret = randomBytes(32).toString('hex');
  const ids = new Set<string>();
  const network = await new Network().start();
  try {
    const db = await (await testPostgres('gotrue')).withNetwork(network).withNetworkAliases('postgres').start();
    try {
      const gateway = createServer();
      gateway.listen(0, '127.0.0.1');
      await once(gateway, 'listening');
      try {
        const origin = `http://127.0.0.1:${(gateway.address() as AddressInfo).port}`;
        const dbInsideDocker = new URL(db.getConnectionUri());
        dbInsideDocker.hostname = 'postgres';
        dbInsideDocker.port = '5432';
        dbInsideDocker.searchParams.set('search_path', 'auth,public');
        const auth = await new GenericContainer('supabase/gotrue:v2.197.0')
          .withNetwork(network)
          .withEnvironment({
            API_EXTERNAL_URL: origin,
            GOTRUE_API_HOST: '0.0.0.0',
            GOTRUE_API_PORT: '9999',
            GOTRUE_DB_DRIVER: 'postgres',
            GOTRUE_DB_DATABASE_URL: dbInsideDocker.href,
            GOTRUE_SITE_URL: appOrigin,
            GOTRUE_DISABLE_SIGNUP: 'true',
            GOTRUE_EXTERNAL_EMAIL_ENABLED: 'true',
            GOTRUE_JWT_ADMIN_ROLES: 'service_role',
            GOTRUE_JWT_AUD: 'authenticated',
            GOTRUE_JWT_DEFAULT_GROUP_NAME: 'authenticated',
            GOTRUE_JWT_SECRET: secret,
          })
          .withExposedPorts(9999)
          .withWaitStrategy(Wait.forHttp('/health', 9999))
          .start();
        try {
          const upstream = new URL(`http://${auth.getHost()}:${auth.getMappedPort(9999)}`);
          gateway.on('request', (req, res) => {
            const path = req.url ?? '/';
            if (path.startsWith(`${authPath}/`)) {
              const forwarded = request(upstream, { path: path.slice(authPath.length), method: req.method, headers: req.headers }, (response) => {
                res.writeHead(response.statusCode ?? 502, response.headers);
                response.pipe(res);
              });
              forwarded.on('error', () => {
                if (!res.headersSent) res.writeHead(502);
                res.end();
              });
              req.pipe(forwarded);
              return;
            }
            const photo = photoPath.exec(path)?.[1];
            if (photo && ids.has(photo)) {
              res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
              res.end('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#282828"/></svg>');
              return;
            }
            res.writeHead(404).end();
          });

          const admin = createClient(origin, jwt(secret, 'service_role'), {
            auth: { autoRefreshToken: false, persistSession: false },
          });
          const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
          if (created.error) throw new Error(`Não foi possível criar a conta local: ${created.error.message}`);
          const prisma = new PrismaClient({ datasourceUrl: db.getConnectionUri() });
          try {
            await prisma.tenant.create({ data: { slug: 'suporte_ti', name: 'Suporte TI' } });
            const { catalog } = await loadEntrega3Catalog(prisma);
            for (const { id } of catalog) ids.add(id);
            await linkEntrega3Professor(prisma, email);
          } finally {
            await prisma.$disconnect();
          }

          const args = ['dev', '--hostname', '127.0.0.1', '--port', '3131'];
          const child = process.platform === 'win32'
            ? spawn(process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'pnpm', ...args], { env: appEnv(), stdio: 'inherit' })
            : spawn('pnpm', args, { env: appEnv(), stdio: 'inherit' });
          const stop = () => child.kill();
          process.once('SIGINT', stop);
          process.once('SIGTERM', stop);
          try {
            const [code, signal] = await once(child, 'exit');
            process.exitCode = code ?? (signal === 'SIGTERM' || signal === 'SIGINT' ? 0 : 1);
          } finally {
            process.removeListener('SIGINT', stop);
            process.removeListener('SIGTERM', stop);
          }

          function appEnv() {
            const env: NodeJS.ProcessEnv = { NODE_ENV: 'development' };
            for (const key of ['PATH', 'PATHEXT', 'SystemRoot', 'WINDIR', 'ComSpec', 'TEMP', 'TMP', 'HOME',
              'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'CI', 'FORCE_COLOR', 'PLAYWRIGHT_TEST_BASE_URL']) {
              if (process.env[key]) env[key] = process.env[key];
            }
            return {
              ...env,
              pnpm_config_verify_deps_before_run: 'false',
              NEXT_TELEMETRY_DISABLED: '1',
              EMPRES_TI_NEXT_DIST_DIR: '.next/playwright-catalogo',
              NEXT_PUBLIC_SUPABASE_URL: origin,
              NEXT_PUBLIC_SUPABASE_ANON_KEY: jwt(secret, 'anon'),
              LOGIN_RATE_LIMIT_SECRET: randomBytes(32).toString('hex'),
              DATABASE_URL: db.getConnectionUri(),
              DIRECT_URL: db.getConnectionUri(),
              VERCEL: '0',
            };
          }
        } finally {
          await auth.stop();
        }
      } finally {
        gateway.closeAllConnections();
        gateway.close();
      }
    } finally {
      await db.stop();
    }
  } finally {
    await network.stop();
  }
}

await main();
