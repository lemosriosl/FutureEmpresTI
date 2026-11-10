import { LoginForm } from '@/components/login-form';
import { loanBusinessDays, loanLimit } from '@/lib/emprestimos';

export default function LoginPage() {
  return (
    <main className="login-shell">
      <div className="login-hero">
        <p className="brand"><span aria-hidden>+</span> EmpresTI</p>
        <div>
          <h1>Equipamentos à mão, sem complicação.</h1>
          <p className="muted">Consulte o catálogo e acompanhe seus empréstimos em um só lugar.</p>
          <div className="login-stats"><span><b>{loanLimit}</b> itens por pessoa</span><span><b>{loanBusinessDays}</b> dias úteis de prazo</span></div>
        </div>
        <p className="muted">Operações · v1</p>
      </div>
      <div className="login-side"><LoginForm /></div>
    </main>
  );
}
