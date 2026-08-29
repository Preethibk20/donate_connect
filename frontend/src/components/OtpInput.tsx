import React, { useRef, KeyboardEvent } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, length = 6 }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;

    const otpArray = value.split('');
    otpArray[index] = val[val.length - 1]; // take the last entered digit
    const newOtp = otpArray.join('').slice(0, length);
    onChange(newOtp);

    // Move to next input if there's a value
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const otpArray = value.split('');
      if (otpArray[index]) {
        // If there's a value, just clear it
        otpArray[index] = '';
        onChange(otpArray.join(''));
      } else if (index > 0) {
        // If it's empty, focus previous and clear it
        inputRefs.current[index - 1]?.focus();
        otpArray[index - 1] = '';
        onChange(otpArray.join(''));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      // focus the next empty input or the last one
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // Pad the value string with spaces for rendering
  const paddedValue = value.padEnd(length, ' ');

  return (
    <div className="flex justify-between gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={paddedValue[index] === ' ' ? '' : paddedValue[index]}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="w-12 h-14 bg-slate-950 border border-slate-800 rounded-xl text-center text-2xl font-bold text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      ))}
    </div>
  );
};
