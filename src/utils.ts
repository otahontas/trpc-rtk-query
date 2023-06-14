import type { AnyProcedure, Procedure } from "@trpc/server";

// Follows trpc internal infer type patterns
export type inferProcedureType<TProcedure extends AnyProcedure> =
  TProcedure extends Procedure<
    infer ProcedureType,
    // any is okay here, we don't care about the second param
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >
    ? ProcedureType
    : never;

// Primitive type from type-fest
type Primitive = bigint | boolean | null | number | string | symbol | undefined;

// TODO: Decide what kind of paths we want to have for deeply nested routes
type PathToString<Path extends string[]> = Path extends [infer first extends string]
  ? first
  : Path extends [infer first extends string, ...infer rest extends string[]]
  ? `${first}_${PathToString<rest>}`
  : ``;

type FlattenPairs<Value, Path extends string[] = []> = {
  [Key in keyof Value]: Value[Key] extends Primitive
    ? [PathToString<[...Path, Extract<Key, string>]>, Value[Key]]
    : FlattenPairs<Value[Key], [...Path, Extract<Key, string>]>;
}[keyof Value];

// TODO: fix possibly infinite type instantiation
type Flatten<Value> = { [Pair in FlattenPairs<Value> as Pair[0]]: Pair[1] };

type A = {
  getUserById: number;
  listUsers: string;
  nested: {
    deep: {
      getVeryNestedMessage: boolean;
    };
  };
};

type B = Flatten<A>;
