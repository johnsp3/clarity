import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 ease-out active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-[#007AFF] text-white hover:bg-[#0056CC]',
    secondary: 'bg-white text-[#1D1D1F] hover:bg-[#F5F5F7] border border-[#D2D2D7]',
    ghost: 'text-[#1D1D1F] hover:bg-[#F5F5F7]',
  }
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[13px]',
    md: 'px-4 py-2 text-[15px]',
    lg: 'px-6 py-3 text-[17px]',
  }
  
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
} 