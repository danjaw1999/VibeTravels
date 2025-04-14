import { describe, it, expect } from 'vitest';
import { createTravelNoteSchema } from '../travel-note.schema';

describe('createTravelNoteSchema', () => {
  it('should validate correct input', () => {
    const input = {
      name: 'Wycieczka do Warszawy',
      description: 'Plan na tydzień w Warszawie',
      isPublic: true
    };

    const result = createTravelNoteSchema.parse(input);
    expect(result).toEqual(input);
  });

  it('should validate input without optional isPublic field', () => {
    const input = {
      name: 'Wycieczka do Warszawy',
      description: 'Plan na tydzień w Warszawie'
    };

    const result = createTravelNoteSchema.parse(input);
    expect(result).toEqual({ ...input, isPublic: true });
  });

  it('should trim whitespace from name and description', () => {
    const input = {
      name: '  Wycieczka do Warszawy  ',
      description: '  Plan na tydzień w Warszawie  '
    };

    const result = createTravelNoteSchema.parse(input);
    expect(result).toEqual({
      name: 'Wycieczka do Warszawy',
      description: 'Plan na tydzień w Warszawie',
      isPublic: true
    });
  });

  it('should reject empty name', () => {
    const input = {
      name: '',
      description: 'Plan na tydzień w Warszawie'
    };

    expect(() => createTravelNoteSchema.parse(input)).toThrow('Destination is required');
  });

  it('should reject empty description', () => {
    const input = {
      name: 'Wycieczka do Warszawy',
      description: ''
    };

    expect(() => createTravelNoteSchema.parse(input)).toThrow('Description is required');
  });

  it('should reject name longer than 255 characters', () => {
    const input = {
      name: 'a'.repeat(256),
      description: 'Plan na tydzień w Warszawie'
    };

    expect(() => createTravelNoteSchema.parse(input)).toThrow('too_big');
  });

  it('should reject non-boolean isPublic value', () => {
    const input = {
      name: 'Wycieczka do Warszawy',
      description: 'Plan na tydzień w Warszawie',
      isPublic: 'true' as unknown as boolean
    };

    expect(() => createTravelNoteSchema.parse(input)).toThrow();
  });
}); 