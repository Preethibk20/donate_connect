import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { OtpInput } from './OtpInput';

describe('OtpInput', () => {
  it('renders correctly with given length', () => {
    render(<OtpInput value="" onChange={vi.fn()} length={6} />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('handles typing digits', async () => {
    const handleChange = vi.fn();
    const Wrapper = () => {
      const [val, setVal] = useState('');
      handleChange.mockImplementation(setVal);
      return <OtpInput value={val} onChange={setVal} length={4} />;
    };

    render(<Wrapper />);
    const inputs = screen.getAllByRole('textbox');
    
    fireEvent.change(inputs[0], { target: { value: '1' } });
    expect(handleChange).toHaveBeenCalledWith('1');
    
    // Check if focus moved to next input
    expect(inputs[1]).toHaveFocus();
    
    fireEvent.change(inputs[1], { target: { value: '2' } });
    expect(handleChange).toHaveBeenCalledWith('12');
  });

  it('ignores non-digit characters', async () => {
    const handleChange = vi.fn();
    render(<OtpInput value="" onChange={handleChange} length={4} />);
    
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'a' } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('handles backspace', async () => {
    const handleChange = vi.fn();
    const Wrapper = () => {
      const [val, setVal] = useState('12');
      handleChange.mockImplementation(setVal);
      return <OtpInput value={val} onChange={setVal} length={4} />;
    };

    render(<Wrapper />);
    const inputs = screen.getAllByRole('textbox');
    
    const user = userEvent.setup();
    
    // Focus on the second input which has value '2'
    inputs[1].focus();
    await user.keyboard('{Backspace}');
    
    expect(handleChange).toHaveBeenCalledWith('1');
    
    // Press backspace again while on empty second input should move to first and clear it
    await user.keyboard('{Backspace}');
    expect(inputs[0]).toHaveFocus();
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('handles pasting data', async () => {
    const handleChange = vi.fn();
    render(<OtpInput value="" onChange={handleChange} length={6} />);
    
    const inputs = screen.getAllByRole('textbox');
    const user = userEvent.setup();
    
    inputs[0].focus();
    // Simulate paste by firing paste event directly or using user-event clipboard
    // But testing-library user-event paste doesn't easily trigger the onPaste handler with clipboardData
    // We can simulate it by firing the event
    
    const pasteEvent = new Event('paste', { bubbles: true });
    Object.assign(pasteEvent, {
      clipboardData: {
        getData: () => '123456'
      }
    });
    
    inputs[0].dispatchEvent(pasteEvent);
    
    expect(handleChange).toHaveBeenCalledWith('123456');
  });
});
