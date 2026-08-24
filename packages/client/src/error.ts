export class PyRPCError extends Error {
  public readonly code: number;
  // JSON-RPC error payloads are arbitrary by protocol contract.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public readonly data?: any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(code: number, message: string, data?: any) {
    super(message);
    this.name = 'PyRPCError';
    this.code = code;
    this.data = data;
    Object.setPrototypeOf(this, PyRPCError.prototype);
  }
}
