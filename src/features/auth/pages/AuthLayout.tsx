import React from "react";
import { motion } from "motion/react";
import { Toaster } from "../../../shared/components/ui/sonner";

import loginImage from "../../../assets/images/FondoLogin.png";
import vManageLogo from "../../../assets/images/VManageLogo.png";
import gvmLogo from "../../../assets/images/GVMLogo.png";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
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
          <div className="absolute inset-0 bg-linear-to-r from-transparent to-black/5" />
        </motion.div>

        <div className="w-full md:w-[50%] flex items-center justify-center p-8 bg-linear-to-r from-white via-blue-50/20 to-green-50/20 relative overflow-hidden">
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
              {children}
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