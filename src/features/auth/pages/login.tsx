import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  login,
  solicitarRestablecimientoContrasena,
} from "../services/auth.services";

import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { useAuth } from "../../../shared/context/AuthContext";
import AuthLayout from "./AuthLayout";

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({ username: "", password: "" });
  const [touched, setTouched] = useState({ username: false, password: false });

  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const hasInvalidCharacters = (value: string) => {
    const validPattern = /^[a-zA-Z0-9@.\-_\s]*$/;
    return !validPattern.test(value);
  };

  const validateUsername = (value: string) => {
    if (!value.trim()) return "El correo es requerido";
    if (hasInvalidCharacters(value)) return "Caracteres no permitidos detectados";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) return "La contraseña es requerida";
    if (value.length < 4) return "Mínimo 4 caracteres";
    if (hasInvalidCharacters(value)) return "Caracteres no permitidos detectados";
    return "";
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (touched.username) {
      setErrors((prev) => ({ ...prev, username: validateUsername(value) }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleBlur = (field: "username" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "username") {
      setErrors((prev) => ({ ...prev, username: validateUsername(username) }));
    }
    if (field === "password") {
      setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
    }
  };

  const handleForgotPassword = async () => {
    const email = username.trim();

    if (!email) {
      toast.info("Ingresa tu correo en el campo Usuario para restablecer tu contraseña");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Ingresa un correo válido");
      return;
    }

    try {
      setIsLoading(true);

      await solicitarRestablecimientoContrasena(email);

      toast.success(
        `Si el correo existe, se generó el enlace de restablecimiento para ${email}`
      );
    } catch (error) {
      console.error("Error solicitando restablecimiento:", error);
      toast.error("No se pudo procesar la solicitud");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({ username: true, password: true });

    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    setErrors({ username: usernameError, password: passwordError });

    if (usernameError || passwordError) {
      toast.error("Por favor corrige los errores");
      return;
    }

    setIsLoading(true);

    try {
      const res = await login({
        email: username.trim(),
        contrasena: password,
      });

      if ("setSession" in auth && typeof (auth as any).setSession === "function") {
        (auth as any).setSession(res.access_token, res.user);
      } else {
        localStorage.setItem("token", res.access_token);
        localStorage.setItem("usuario", JSON.stringify(res.user));
        localStorage.setItem("isAuthenticated", "true");
        auth.setUsuario(res.user as any);
      }

      toast.success(`¡Bienvenido ${res.user.nombre}!`);
      navigate("/app");
    } catch (err: any) {
      const status = err?.response?.status;

      if (status === 401) toast.error("Credenciales inválidas");
      else if (status === 400) toast.error("Datos inválidos (revisa email o contraseña)");
      else toast.error("Error al iniciar sesión");

      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="username">Correo electrónico:</Label>
          <div className="relative">
            <User
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.username && touched.username ? "text-red-500" : "text-gray-400"
                }`}
              size={20}
            />
            <Input
              ref={usernameRef}
              id="username"
              type="text"
              placeholder="Ingrese su correo"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              onBlur={() => handleBlur("username")}
              disabled={isLoading}
              className={`h-11 pl-10 transition-all duration-200 ${errors.username && touched.username
                  ? "border-red-500 focus-visible:ring-red-500"
                  : touched.username && !errors.username
                    ? "border-green-500 focus-visible:ring-green-500"
                    : ""
                }`}
            />
          </div>
          {errors.username && touched.username && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {errors.username}
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña:</Label>
          <div className="relative">
            <Lock
              className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.password && touched.password ? "text-red-500" : "text-gray-400"
                }`}
              size={20}
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={() => handleBlur("password")}
              disabled={isLoading}
              className={`h-11 pl-10 pr-10 transition-all duration-200 ${errors.password && touched.password
                  ? "border-red-500 focus-visible:ring-red-500"
                  : touched.password && !errors.password
                    ? "border-green-500 focus-visible:ring-green-500"
                    : ""
                }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && touched.password && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500"
            >
              {errors.password}
            </motion.p>
          )}
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-all duration-200"
            disabled={isLoading}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              Iniciando sesión...
            </span>
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}