import type { Middleware } from 'openapi-typescript-fetch';
import { camelToSnakeCase, transformKeysToSnakeCase } from '../utils/case-transform';

export function createSnakeCaseRequestMiddleware(): Middleware {
  return async (url, init, next) => {
    // Transform query string keys
    const [base, search] = url.split('?');
    let transformedUrl = base;
    if (search) {
      const params = new URLSearchParams(search);
      const newParams = new URLSearchParams();
      for (const [key, value] of params.entries()) {
        newParams.append(camelToSnakeCase(key), value);
      }
      transformedUrl = `${base}?${newParams.toString()}`;
    }

    // Transform JSON body keys
    let transformedInit = init;
    const contentType = (init.headers as Record<string, string>)?.['content-type'] ?? '';
    if (init.body && contentType.includes('application/json')) {
      const parsed = JSON.parse(init.body as string);
      transformedInit = {
        ...init,
        body: JSON.stringify(transformKeysToSnakeCase(parsed)),
      };
    }

    return next(transformedUrl, transformedInit);
  };
}
