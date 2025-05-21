import React from 'react';
import '../styles/login.css';

export default function Login() {
  return (
    <div className="login-container">
      <form className="login-form">
        <h1 className="login-title">Sistema de Visitas</h1>
        <p className="login-subtitle">Faça login para continuar</p>
        
        <input 
          type="email" 
          placeholder="Email"
          className="login-input"
        />
        
        <input 
          type="password" 
          placeholder="Senha"
          className="login-input"
        />
        
        <button className="login-button">
          Entrar
        </button>
        
        <a href="#" className="login-link">Não tem uma conta? Cadastre-se</a>
        
        <div className="login-divider">ou</div>
        
        <button className="login-button" style={{backgroundColor: '#6B7280'}}>
          Entrar anonimamente
        </button>
      </form>
    </div>
  );
}