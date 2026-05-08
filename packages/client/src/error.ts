export class PyRPCError extends Error {
  public readonly code: number;
  public readonly data?: any;

  constructor(code: number, message: string, data?: any) {
    super(message);
    this.name = 'PyRPCError';
    this.code = code;
    this.data = data;
    Object.setPrototypeOf(this, PyRPCError.prototype);
  }
}
