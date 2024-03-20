import {
  type BaseQueryFn,
  type MutationDefinition,
  type QueryDefinition,
} from "@reduxjs/toolkit/query/react";
import {
  type AnyProcedure,
  type AnyRouter,
  type Procedure,
  type inferProcedureInput,
  type inferProcedureOutput,
} from "@trpc/server";

/** Infer type of procedure ("query" or "mutation") from procedure. We don't support
 * "subscription" type, so it's dropped here
 * @internal
 **/
type inferProcedureType<TProcedure extends AnyProcedure> =
  TProcedure extends Procedure<
    infer ProcedureType,
    // we don't care about the second param, so it can be any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any
  >
    ? Exclude<ProcedureType, "subscription">
    : never;

/** Formatter for path and endpoint. If the path is empty, just return the endpoint
 * name. Otherwise, concat the endpoint name with the path, separated by an underscore.
 * @internal
 **/
type FormatPathAndEndpointName<MaybeEndpointName, EndpointPath> =
  EndpointPath extends ""
    ? MaybeEndpointName
    : `${Extract<EndpointPath, string>}_${Capitalize<
        Extract<MaybeEndpointName, string>
      >}`;

/** Flatten deeply nested routes, so we only have pairs of [endpoint name with path,
 * procedure]. This helps avoiding infinitely deep type error from TS compiler.
 * @internal
 **/
type FlattenToEndpointProcedurePairs<MaybeProcedureRecord, EndpointPath = ""> = {
  // Grab result of "FormatPathAndEndpointName" to FormatterPath variable
  [MaybeEndpointName in keyof MaybeProcedureRecord]: FormatPathAndEndpointName<
    MaybeEndpointName,
    EndpointPath
  > extends infer FormattedPath
    ? // If this is procedure, return pair of [endpoint name with path, procedure]
      MaybeProcedureRecord[MaybeEndpointName] extends AnyProcedure
      ? [FormattedPath, MaybeProcedureRecord[MaybeEndpointName]]
      : // If this is router, recursively flatten the router
        MaybeProcedureRecord[MaybeEndpointName] extends AnyRouter
        ? FlattenToEndpointProcedurePairs<
            MaybeProcedureRecord[MaybeEndpointName],
            FormattedPath
          >
        : never // This was not procedure or router
    : never; // Will never happen, but must be here for the extends infer -pattern
}[keyof MaybeProcedureRecord];

/** Type structure of [endpoint name with path, procedure] to check extending against
 * @internal
 **/
type EndpointProcedurePair = [string, AnyProcedure];

/** Create endpoint definitions from TRPC Router for RTK query api
 * @internal
 **/
export type CreateEndpointDefinitions<
  TRouter extends AnyRouter,
  BaseQuery extends BaseQueryFn,
  ReducerPath extends string,
  TagTypes extends string,
> = {
  [Pair in FlattenToEndpointProcedurePairs<
    TRouter["_def"]["record"]
  > as Pair extends EndpointProcedurePair // should always extend but needs to be checked
    ? Pair[0]
    : never]: Pair extends EndpointProcedurePair // should always extend but needs to be checked
    ? Pair[1] extends AnyProcedure
      ? inferProcedureType<Pair[1]> extends infer ProcedureType
        ? ProcedureType extends "query"
          ? QueryDefinition<
              inferProcedureInput<Pair[1]>,
              BaseQuery,
              TagTypes,
              inferProcedureOutput<Pair[1]>,
              ReducerPath
            >
          : ProcedureType extends "mutation"
            ? MutationDefinition<
                inferProcedureInput<Pair[1]>,
                BaseQuery,
                TagTypes,
                inferProcedureOutput<Pair[1]>,
                ReducerPath
              >
            : never
        : never
      : never
    : never;
};
