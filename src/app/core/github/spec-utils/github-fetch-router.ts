import { GithubFetchFn } from '../github-fetch.type';

const GET_METHOD = 'GET';

export type RouteHandler = (init?: RequestInit) => Response;

/** Routes `<METHOD> <url>` keys to response factories; unrouted requests reject like a network failure. */
export function routeFetch(routes: Record<string, RouteHandler>): GithubFetchFn {
  return (url, init) => {
    const handler = routes[`${init?.method ?? GET_METHOD} ${url}`];

    if (handler === undefined) {
      return Promise.reject(new Error(`Unhandled route: ${url}`));
    }

    return Promise.resolve(handler(init));
  };
}

export function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body));
}

export function statusResponse(status: number): Response {
  return new Response(null, { status });
}

export function parseJsonBody<T = unknown>(init?: RequestInit): T {
  return JSON.parse(String(init?.body));
}

/** Parsed JSON bodies of the `<method> <url>` requests among `calls`, in call order. */
export function requestBodiesOf<T = unknown>(calls: (readonly [string, RequestInit?])[], method: string, url: string): T[] {
  const bodies: T[] = [];

  for (const [callUrl, init] of calls) {
    if (callUrl === url && init?.method === method) {
      bodies.push(parseJsonBody(init));
    }
  }

  return bodies;
}

export function decodeBase64Bytes(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

export function decodeBase64Json(base64: string): unknown {
  return JSON.parse(new TextDecoder().decode(decodeBase64Bytes(base64)));
}
