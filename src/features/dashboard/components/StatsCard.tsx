import { motion } from "motion/react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  color: "blue" | "green" | "orange" | "purple";
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  change,
  isPositive,
  color,
  onClick,
}: StatsCardProps) {
  
  // Mapa de colores para los gradientes de fondo
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
  };

  // Mapa de colores para el icono y texto
  const textColors = {
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
      onClick={onClick}
    >
      {/* Círculo decorativo de fondo */}
      <div
        className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${colorClasses[color]} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}
      />
      
      <div className="relative">
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-gray-900 mb-2 font-bold text-2xl">{value}</p>
        
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-medium ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            {change}
          </span>
          
          <motion.svg
            whileHover={{ x: 4 }}
            transition={{ duration: 0.2 }}
            className={`w-4 h-4 opacity-50 ${textColors[color]}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </motion.svg>
        </div>
      </div>
    </motion.div>
  );
}