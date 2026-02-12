import React, { useState, useEffect } from 'react';
import { Textarea } from '../../shared/components/ui/textarea';
import { Label } from '../../shared/components/ui/label';

interface ValidatedTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  validator: (value: string) => string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
}

export function ValidatedTextarea({
  id,
  label,
  value,
  onChange,
  validator,
  placeholder,
  required = false,
  disabled = false,
  rows = 3
}: ValidatedTextareaProps) {
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  // Validar en tiempo real cuando el campo ya fue tocado
  useEffect(() => {
    if (touched) {
      const errorMessage = validator(value);
      setError(errorMessage);
    }
  }, [value, touched, validator]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      <Textarea
        id={id}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
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
