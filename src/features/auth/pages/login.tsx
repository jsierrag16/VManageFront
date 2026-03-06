import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion } from 'motion/react'; // Asegúrate de tener esta librería o framer-motion
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Componentes UI compartidos
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Label } from '../../../shared/components/ui/label';
import { Toaster } from '../../../shared/components/ui/sonner';
import { ImageWithFallback } from '../../../shared/components/figma/ImageWithFallback';

// Assets (Rutas ajustadas a tu estructura modular)
import loginImage from '../../../assets/images/FondoLogin.png';
import vManageLogo from '../../../assets/images/VManageLogo.png';
import gvmLogo from '../../../assets/images/GVMLogo.png';

// Data y Contexto
import { usuariosSistema } from '../../../data/usuarios-sistema';
import { useAuth } from '../../../shared/context/AuthContext';

export default function Login() {
  const auth = useAuth();
  const navigate = useNavigate();

  // Estados
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de validación visual
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [touched, setTouched] = useState({ username: false, password: false });

  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  // --- LÓGICA DE VALIDACIÓN (Traída del diseño original) ---
  const hasInvalidCharacters = (value: string) => {
    const validPattern = /^[a-zA-Z0-9@.\-_\s]*$/;
    return !validPattern.test(value);
  };

  const validateUsername = (value: string) => {
    if (!value.trim()) return 'El usuario es requerido';
    if (hasInvalidCharacters(value)) return 'Caracteres no permitidos detectados';
    return '';
  };

  const validatePassword = (value: string) => {
    if (!value.trim()) return 'La contraseña es requerida';
    if (value.length < 4) return 'Mínimo 4 caracteres';
    if (hasInvalidCharacters(value)) return 'Caracteres no permitidos detectados';
    return '';
  };

  // --- HANDLERS ---
  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (touched.username) {
      setErrors(prev => ({ ...prev, username: validateUsername(value) }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(value) }));
    }
  };

  const handleBlur = (field: 'username' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'username') setErrors(prev => ({ ...prev, username: validateUsername(username) }));
    if (field === 'password') setErrors(prev => ({ ...prev, password: validatePassword(password) }));
  };

  const handleForgotPassword = () => {
    if (!username.trim()) {
      toast.info('Ingresa tu usuario para recuperar tu contraseña');
      return;
    }
    toast.success('Se ha enviado un link de recuperación a tu correo');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Marcar todos como tocados para mostrar errores si los hay
    setTouched({ username: true, password: true });

    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    setErrors({ username: usernameError, password: passwordError });

    if (usernameError || passwordError) {
      toast.error('Por favor corrige los errores');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const usuario = usuariosSistema.find(
        u => u.email.toLowerCase() === username.toLowerCase()
      );

      // Verificaciones
      if (!usuario) {
        setIsLoading(false);
        toast.error('Usuario no existente');
        return;
      }

      if (usuario.password !== password) {
        setIsLoading(false);
        toast.error('Contraseña incorrecta');
        return;
      }

      // Éxito
      localStorage.setItem('usuario', JSON.stringify(usuario));
      localStorage.setItem('isAuthenticated', 'true');

      auth.setUsuario(usuario);
      toast.success(`¡Bienvenido ${usuario.nombre}!`);
      setIsLoading(false);

      // Navegación
      navigate('/app');

    }, 1500);
  };

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen flex">

        {/* --- LADO IZQUIERDO (IMAGEN) --- */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="hidden md:flex md:w-[50%] relative overflow-hidden"
        >
          <ImageWithFallback
            src={loginImage}
            fallbackSrc="https://images.unsplash.com/photo-1712732249476-83f7568a0b70?auto=format&fit=crop&q=80&w=1080"
            alt="Login"
            className="w-full h-full object-cover"
          />
          {/* Gradiente overlay sutil */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5" />
        </motion.div>

        {/* --- LADO DERECHO (FORMULARIO) --- */}
        <div className="w-full md:w-[50%] flex items-center justify-center p-8 bg-gradient-to-br from-white via-blue-50/20 to-green-50/20 relative overflow-hidden">

          {/* Círculos decorativos de fondo */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-100/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md relative z-10"
          >
            {/* Logo VManage */}
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

            {/* Tarjeta del Formulario */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-gray-100"
            >
              <form onSubmit={handleLogin} className="space-y-6">

                {/* Input Usuario */}
                <div className="space-y-2">
                  <Label htmlFor="username">Usuario:</Label>
                  <div className="relative">
                    <User
                      className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.username && touched.username ? 'text-red-500' : 'text-gray-400'
                        }`}
                      size={20}
                    />
                    <Input
                      ref={usernameRef}
                      id="username"
                      type="text"
                      placeholder="Ingrese su usuario"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      onBlur={() => handleBlur('username')}
                      disabled={isLoading}
                      className={`h-11 pl-10 transition-all duration-200 ${errors.username && touched.username
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : touched.username && !errors.username
                            ? 'border-green-500 focus-visible:ring-green-500'
                            : ''
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

                {/* Input Contraseña */}
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña:</Label>
                  <div className="relative">
                    <Lock
                      className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${errors.password && touched.password ? 'text-red-500' : 'text-gray-400'
                        }`}
                      size={20}
                    />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Ingrese su contraseña"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      onBlur={() => handleBlur('password')}
                      disabled={isLoading}
                      className={`h-11 pl-10 pr-10 transition-all duration-200 ${errors.password && touched.password
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : touched.password && !errors.password
                            ? 'border-green-500 focus-visible:ring-green-500'
                            : ''
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

                {/* Link Olvidé contraseña */}
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

                {/* Botón Submit */}
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
                    'Iniciar sesión'
                  )}
                </Button>
              </form>
            </motion.div>

            {/* Logo GVM */}
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