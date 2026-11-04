import { canTransition } from '../../src/modules/assignments/state-machine';

describe('assignment state machine', () => {
  it('cannot reopen a completed assignment', () =>
    expect(canTransition('completed', 'in_progress')).toBe(false));
  it('cannot reopen a cancelled assignment', () =>
    expect(canTransition('cancelled', 'agreed')).toBe(false));
  it('cannot skip straight to completed', () =>
    expect(canTransition('agreed', 'completed')).toBe(false));
  it('requester concern returns to in_progress', () =>
    expect(canTransition('completion_pending', 'in_progress')).toBe(true));
});
