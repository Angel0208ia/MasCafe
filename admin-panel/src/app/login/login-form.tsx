"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { signIn } from "../actions";
import styles from "./login.module.css";

export function LoginForm() {
  const [state, formAction, loading] = useActionState(signIn, { error: "" });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className={styles.form} action={formAction}>
      <div hidden aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className={styles.field}>
        <span>Correo del personal</span>
        <span className={styles.inputShell}>
          <Mail aria-hidden="true" size={19} />
          <input
            type="email"
            name="email"
            maxLength={254}
            autoCapitalize="none"
            spellCheck={false}
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
            name="password"
            maxLength={256}
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

      {state.error && <p className={styles.error} role="alert">{state.error}</p>}

      <button className={styles.submit} type="submit" disabled={loading}>
        {loading ? <LoaderCircle className={styles.spinner} size={19} /> : null}
        {loading ? "Ingresando…" : "Ingresar al panel"}
      </button>
    </form>
  );
}
