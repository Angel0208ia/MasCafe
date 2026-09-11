"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("El correo o la contraseña no son correctos.");
      setLoading(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <label className={styles.field}>
        <span>Correo del personal</span>
        <span className={styles.inputShell}>
          <Mail aria-hidden="true" size={19} />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nombre@mascafe.mx"
            autoComplete="email"
            required
          />
        </span>
      </label>

      <label className={styles.field}>
        <span>Contraseña</span>
        <span className={styles.inputShell}>
          <LockKeyhole aria-hidden="true" size={19} />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
          />
          <button
            className={styles.reveal}
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <button className={styles.submit} type="submit" disabled={loading}>
        {loading ? <LoaderCircle className={styles.spinner} size={19} /> : null}
        {loading ? "Ingresando…" : "Ingresar al panel"}
      </button>
    </form>
  );
}

