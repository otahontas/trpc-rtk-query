// Type level helper, use for testing when vitest isn't flexible enough
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;
export type Assert<T extends true> = T extends true ? true : false;
