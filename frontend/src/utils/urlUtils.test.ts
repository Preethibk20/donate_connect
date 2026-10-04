import { describe, it, expect } from 'vitest';
import { getWsUrl } from './urlUtils';

describe('getWsUrl', () => {
  it('safely transforms standard URLs', () => {
    expect(getWsUrl('http://localhost:8080/api')).toBe('http://localhost:8080/ws');
    expect(getWsUrl('https://api.example.com/api')).toBe('https://api.example.com/ws');
    expect(getWsUrl('https://x.onrender.com/api/')).toBe('https://x.onrender.com/ws');
    expect(getWsUrl('https://api.myapp.com/api/v1/api')).toBe('https://api.myapp.com/api/v1/ws');
  });
});
