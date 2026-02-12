"use client";

import { Toaster as Sonner, ToasterProps } from "sonner@2.0.3";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-center"
      duration={4000}
      visibleToasts={3}
      closeButton
      toastOptions={{
        style: {
          padding: '16px',
          gap: '12px',
          borderRadius: '12px',
          fontSize: '15px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        },
        classNames: {
          error: 'bg-red-50 text-red-900 border-red-200',
          success: 'bg-green-50 text-green-900 border-green-200',
          warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
          info: 'bg-blue-50 text-blue-900 border-blue-200',
          toast: 'border shadow-lg',
          title: 'font-semibold',
          description: 'text-sm opacity-90',
          closeButton: 'bg-white border-gray-200 hover:bg-gray-100',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
