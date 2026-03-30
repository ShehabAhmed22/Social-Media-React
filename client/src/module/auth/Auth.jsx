import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ← لازم
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin, useRegister } from "../../store/auth/auth.slice.js";
import {
  loginSchema,
  registerSchema,
} from "../../validation/auth.validation.js";
import "./auth.scss";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const InstagramLogo = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="ig-logo-svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

// ─── Floating Label Input ─────────────────────────────────────────────────────
const FloatingInput = ({
  label,
  type = "text",
  register: reg,
  error,
  showToggle,
  onToggle,
  showPassword,
}) => {
  const [focused, setFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);

  return (
    <div
      className={`float-field ${focused ? "focused" : ""} ${error ? "has-error" : ""}`}
    >
      <div className="float-inner">
        <input
          type={showToggle ? (showPassword ? "text" : "password") : type}
          {...reg({
            onChange: (e) => setHasValue(e.target.value.length > 0),
          })}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={hasValue || focused ? "filled" : ""}
          autoComplete="off"
        />
        <label className={hasValue || focused ? "active" : ""}>{label}</label>
        {showToggle && (
          <button
            type="button"
            className="toggle-eye"
            onClick={onToggle}
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && <span className="field-error">{error.message}</span>}
    </div>
  );
};

// ─── Auth Component ───────────────────────────────────────────────────────────
function Auth({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isLogin = mode === "login";

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(isLogin ? loginSchema : registerSchema),
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const mutation = isLogin ? loginMutation : registerMutation;

  const onSubmit = (data) => {
    mutation.mutate(data, {
      onSuccess: (res) => {
        const token = res?.data?.data?.token;
        console.log("Token from server:", token);
        if (token && onLoginSuccess) {
          onLoginSuccess(token); // حدث state الابلكيشن
          navigate("/posts"); // <-- هنا بنحول المستخدم مباشرة للبوست
        }
      },
      onError: (err) => {
        console.log(err);
      },
    });
  };

  const switchMode = (newMode) => {
    reset();
    setShowPassword(false);
    setShowConfirm(false);
    setMode(newMode);
  };

  return (
    <div className="auth-root">
      <div className="auth-bg">
        <span className="blob blob-1" />
        <span className="blob blob-2" />
        <span className="blob blob-3" />
      </div>

      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-logo">
            <InstagramLogo />
          </div>

          <form
            className="auth-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {!isLogin && (
              <FloatingInput
                label="Username"
                type="text"
                register={(opts) => register("username", opts)}
                error={errors.username}
              />
            )}

            <FloatingInput
              label="Email"
              type="email"
              register={(opts) => register("email", opts)}
              error={errors.email}
            />

            <FloatingInput
              label="Password"
              showToggle
              register={(opts) => register("password", opts)}
              error={errors.password}
              showPassword={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
            />

            {!isLogin && (
              <FloatingInput
                label="Confirm Password"
                showToggle
                register={(opts) => register("confirmPassword", opts)}
                error={errors.confirmPassword}
                showPassword={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
              />
            )}

            {mutation.isError && (
              <p className="server-error">
                {mutation.error?.response?.data?.message ||
                  "Something went wrong"}
              </p>
            )}

            <button
              type="submit"
              className="auth-btn"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <span className="spinner" />
              ) : isLogin ? (
                "Log In"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="auth-switch-card">
            {isLogin ? (
              <p>
                Don't have an account?{" "}
                <button type="button" onClick={() => switchMode("register")}>
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode("login")}>
                  Log in
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
