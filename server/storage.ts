// No persistent storage needed — this is a live search dashboard
// All data is fetched in real-time from external APIs

export interface IStorage {}

export class MemStorage implements IStorage {}

export const storage = new MemStorage();
