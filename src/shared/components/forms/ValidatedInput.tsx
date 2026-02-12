import React, { useState, useEffect } from 'react';
import { Input } from '../../shared/components/ui/input';
import { Label } from '../../shared/components/ui/label';

interface ValidatedInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  validator: (value: string) => string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}

export function ValidatedInput({
  id,
  label,
  value,
  onChange,
  validator,
  placeholder,
  type = 'text',
  required = false,
  disabled = false
}: ValidatedInputProps) {
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  // Validar en tiempo real cuando el campo ya fue tocado
  useEffect(() => {
    if (touched) {
      const errorMessage = validator(value);
      setError(errorMessage);
    }
  }, [value, touched, validator]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleBlur = () => {
    setTouched(true);
    const errorMessage = validator(value);
    setError(errorMessage);
  };

  return (
    <div>
      <Label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={
          touched && error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : ''
        }
      />
      {touched && error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
