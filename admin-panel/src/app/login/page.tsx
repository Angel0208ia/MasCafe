import { Coffee, ShieldCheck } from "lucide-react";
import { LoginForm } from "./login-form";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <section className={styles.brandPanel}>
        <div className={styles.brandMark}><Coffee aria-hidden="true" size={31} /></div>
        <div className={styles.brandCopy}>
          <span>MÁS CAFÉ</span>
          <strong>Panel de negocio</strong>
        </div>
        <div className={styles.brandMessage}>
          <p>OPERACIÓN DIARIA</p>
          <h1>Los pedidos claros.<br />El servicio en movimiento.</h1>
          <span>Recibe, prepara y entrega desde un solo lugar.</span>
        </div>
        <div className={styles.securityNote}>
          <ShieldCheck aria-hidden="true" size={19} />
          Acceso exclusivo para personal autorizado
        </div>
      </section>

      <section className={styles.loginPanel}>
        <div className={styles.mobileBrand}>
          <div className={styles.brandMark}><Coffee aria-hidden="true" size={27} /></div>
          <strong>Más Café</strong>
        </div>
        <div className={styles.card}>
          <p className={styles.eyebrow}>BIENVENIDO</p>
          <h2>Inicia sesión</h2>
          <p className={styles.description}>Usa la cuenta asignada por el administrador.</p>
          <LoginForm />
          <p className={styles.support}>Si no tienes acceso, solicítalo al administrador de Más Café.</p>
        </div>
      </section>
    </main>
  );
}

