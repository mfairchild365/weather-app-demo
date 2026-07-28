export interface ApiErrorBody {
  error: string;
  message: string;
}

/** Consistent JSON error shape for every non-2xx response — never a stack trace or HTML page. */
export function errorBody(error: string, message: string): ApiErrorBody {
  return { error, message };
}

export function notFoundBody(message: string): ApiErrorBody {
  return errorBody('not_found', message);
}

export function badRequestBody(message: string): ApiErrorBody {
  return errorBody('bad_request', message);
}
