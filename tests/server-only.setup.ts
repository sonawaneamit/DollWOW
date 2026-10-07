import { vi } from 'vitest';

// Next enforces this import boundary at build time; these tests run in Node.
vi.mock('server-only', () => ({}));
