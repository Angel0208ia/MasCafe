import Link from "next/link";
import { ShieldX } from "lucide-react";
import { signOut } from "@/app/actions";
import styles from "./unauthorized.module.css";

export default function UnauthorizedPage() {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.icon}><ShieldX size={30} /></div>
        <p>ACCESO PENDIENTE</p>
        <h1>Tu cuenta todavía no pertenece al personal</h1>
        <span>Un administrador debe activar tu usuario antes de que puedas ver los pedidos.</span>
        <div className={styles.actions}>
          <Link href="/">Intentar nuevamente</Link>
          <form action={signOut}><button type="submit">Cerrar sesión</button></form>
        </div>
      </section>
    </main>
  );
}

