import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../shared/components/ui/button";
import { Input } from "../../../shared/components/ui/input";
import { Label } from "../../../shared/components/ui/label";
import { Toaster } from "../../../shared/components/ui/sonner";

import loginImage from "../../../assets/images/FondoLogin.png";
import vManageLogo from "../../../assets/images/VManageLogo.png";
import gvmLogo from "../../../assets/images/GVMLogo.png";

import { login } from "../services/auth.services";
import { useAuth } from "../../../shared/context/AuthContext";

type FormErrors = {
  email: string;
  password: string;
};

type FormTouched = {
  email: boolean;
  password: boolean;
};

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState<FormTouched>({
    email: false,
    password: false,
  });

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const hasInvalidCharacters = (value: string) => {
    const validPattern = /^[a-zA-Z0-9@.\-_\s]*$/;
    return !validPattern.test(value);
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "El correo es requerido";
    if (hasInvalidCharacters(value)) return "Caracteres no permitidos detectados";

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value.trim())) return "Ingresa un correo válido";

    return "";
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) return "La contraseña es requerida";
    if (value.length < 4) return "Mínimo 4 caracteres";
    if (hasInvalidCharacters(value)) return "Caracteres no permitidos detectados";
    return "";
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (touched.email) {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(value),
      }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (touched.password) {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(value),
      }));
    }
  };

  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    if (field === "email") {
      setErrors((prev) => ({
        ...prev,
        email: validateEmail(email),
      }));
    }

    if (field === "password") {
      setErrors((prev) => ({
        ...prev,
        password: validatePassword(password),
      }));
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      toast.info("Ingresa tu correo para recuperar tu contraseña");
      return;
    }

    toast.success("Se ha enviado un link de recuperación a tu correo");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      email: true,
      password: true,
    });

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setErrors({
      email: emailError,
      password: passwordError,
    });

    if (emailError || passwordError) {
      toast.error("Por favor corrige los errores");
      return;
    }

    setIsLoading(true);

    try {
      const res = await login({
        email: email.trim(),
        contrasena: password,
      });

      // Guardar sesión SIEMPRE antes de navegar
      localStorage.setItem("token", res.access_token);
      localStorage.setItem("usuario", JSON.stringify(res.user));
      localStorage.setItem("isAuthenticated", "true");

      // Sincronizar contexto sin romper tu lógica actual
      if ("setSession" in auth && typeof (auth as any).setSession === "function") {
        (auth as any).setSession(res.access_token, res.user);
      } else if ("setUsuario" in auth && typeof auth.setUsuario === "function") {
        auth.setUsuario(res.user as any);
      }

      toast.success(`¡Bienvenido ${res.user?.nombre ?? ""}!`);
      navigate("/app", { replace: true });
    } catch (err: any) {
      const backendMessage =
        err?.response?.data?.error?.message ??
        err?.response?.data?.message ??
        "Error al iniciar sesión";

      toast.error(
        Array.isArray(backendMessage)
          ? backendMessage.join(", ")
          : backendMessage
      );

      console.error("Login error:", err?.response?.data || err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster richColors position="top-center" />

      <div className="min-h-screen flex">
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="hidden md:flex md:w-[50%] relative overflow-hidden"
        >
          <img
            src={loginImage}
            alt="Login"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5" />
        </motion.div>

        <div className="w-full md:w-[50%] flex items-center justify-center p-8 bg-gradient-to-br from-white via-blue-50/20 to-green-50/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md relative z-10"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-12 text-center"
            >
              <div className="inline-flex items-center justify-center">
                <img src={vManageLogo} alt="VManage" className="h-24 w-auto" />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100"
            >
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo:</Label>

                  <div className="relative">
                    <User
                      className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                        errors.email && touched.email ? "text-red-500" : "text-gray-400"
                      }`}
                      size={20}
                    />

                    <Input
                      ref={emailRef}
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Ingrese su correo"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onBlur={() => handleBlur("email")}
                      disabled={isLoading}
                      autoComplete="email"
                      className={`h-11 pl-10 transition-all duration-200 ${
                        errors.email && touched.email
                          ? "border-red-500 focus-visible:ring-red-500"
                          : touched.email && !errors.email
                          ? "border-green-500 focus-visible:ring-green-500"
                          : ""
                      }`}
                    />
                  </div>

                  {errors.email && touched.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-500"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña:</Label>

                  <div className="relative">
                    <Lock
                      className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                        errors.password && touched.password ? "text-red-500" : "text-gray-400"
                      }`}
                      size={20}
                    />

                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingrese su contraseña"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      onBlur={() => handleBlur("password")}
                      disabled={isLoading}
                      autoComplete="current-password"
                      className={`h-11 pl-10 pr-10 transition-all duration-200 ${
                        errors.password && touched.password
                          ? "border-red-500 focus-visible:ring-red-500"
                          : touched.password && !errors.password
                          ? "border-green-500 focus-visible:ring-green-500"
                          : ""
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      disabled={isLoading}
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
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-12 text-center"
            >
              <div className="inline-flex items-center justify-center">
                <img src={gvmLogo} alt="GVM" className="h-20 w-auto" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
