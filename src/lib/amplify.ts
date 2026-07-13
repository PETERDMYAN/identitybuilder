import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';

import type { Schema } from '../../amplify/data/resource';
import outputs from '../../amplify_outputs.json';

Amplify.configure(outputs);

let _client: ReturnType<typeof generateClient<Schema>> | null = null;

/** AppSync data client (owner-scoped via the Cognito user pool). */
export function db() {
  if (!_client) _client = generateClient<Schema>({ authMode: 'userPool' });
  return _client;
}

type ListResult<T> = { data: T[]; nextToken?: string | null; errors?: { message?: string }[] };

/** Drain every page of an Amplify list() call. */
export async function listAll<T>(
  lister: (opts: Record<string, unknown>) => Promise<ListResult<T>>,
  filter?: Record<string, unknown>,
): Promise<T[]> {
  const out: T[] = [];
  let nextToken: string | null | undefined;
  do {
    const res = await lister({ ...(filter ? { filter } : {}), limit: 1000, nextToken });
    if (res.errors?.length) throw new Error(res.errors[0]?.message ?? 'AppSync error');
    out.push(...res.data);
    nextToken = res.nextToken;
  } while (nextToken);
  return out;
}

/** Throw a readable error when a mutation comes back with GraphQL errors. */
export function must<T>(res: { data: T | null; errors?: { message?: string }[] }): T {
  if (res.errors?.length) throw new Error(res.errors[0]?.message ?? 'AppSync error');
  if (res.data == null) throw new Error('Empty response from backend');
  return res.data;
}
