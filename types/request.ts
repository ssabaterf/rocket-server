/* Defining the interface for the Request object. */
export interface Request {
    request: unknown,
    path: string,
    url: string,
    method: string,
    headers: { [key: string]: string }
    protocol: string
    body?: unknown,
    params?: { [key: string]: string }
    query?: { [key: string]: string }
}