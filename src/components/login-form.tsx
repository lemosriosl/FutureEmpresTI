'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { loginInput } from '@/lib/inputs';
import { trpc } from '@/lib/trpc';
import type { RouterInputs } from '@/server/api/root';

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<RouterInputs['auth']['login']>({
    resolver: zodResolver(loginInput),
    defaultValues: { email: '', password: '' },
  });
  const login = trpc.auth.login.useMutation({
    onSuccess: () => {
      queryClient.clear();
      router.replace('/catalogo');
      router.refresh();
    },
  });
  const invalid = form.formState.errors;

  return (
    <form className="login-form" onSubmit={form.handleSubmit((data) => login.mutate(data))}>
      <h2>Entrar</h2>
      <p className="muted">Use o e-mail e a senha da sua conta.</p>
      <label htmlFor="email">E-mail</label>
      <input id="email" type="email" autoComplete="username" aria-invalid={!!invalid.email} required {...form.register('email')} />
      {invalid.email && <p role="alert" className="danger">Informe um e-mail válido.</p>}
      <label htmlFor="password">Senha</label>
      <input id="password" type="password" autoComplete="current-password" aria-invalid={!!invalid.password} required {...form.register('password')} />
      {invalid.password && <p role="alert" className="danger">Confira a senha informada.</p>}
      <button className="button primary" disabled={login.isPending}>{login.isPending ? 'Entrando…' : 'Entrar'}</button>
      {login.error && <p role="alert" className="danger">{login.error.message}</p>}
      <p className="muted">Precisa de acesso? Fale com Operações.</p>
    </form>
  );
}
