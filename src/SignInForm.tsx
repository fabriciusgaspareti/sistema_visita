"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";
import "./styles/auth.css";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="auth-container">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((_error) => {
            const toastTitle =
              flow === "signIn"
                ? "Não foi possível entrar, você deseja se cadastrar?"
                : "Não foi possível cadastrar, você já possui uma conta?";
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <div className="form-header">
          <h1 className="auth-title">Sistema de Visitas</h1>
          <p className="auth-subtitle">Faça login para continuar</p>
        </div>
        
        <input
          className="input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="input-field"
          type="password"
          name="password"
          placeholder="Senha"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Entrar" : "Cadastrar"}
        </button>
        
        <div className="text-center text-sm text-slate-600">
          <span>
            {flow === "signIn"
              ? "Não tem uma conta? "
              : "Já tem uma conta? "}
          </span>
          <button
            type="button"
            className="text-blue-500 hover:text-blue-600 cursor-pointer font-medium"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Cadastre-se" : "Faça login"}
          </button>
        </div>
      </form>
    </div>
  );
}
