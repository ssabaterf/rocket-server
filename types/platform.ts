import { Request } from './request.ts';
import { Reply } from './response.ts';

export type Method = "POST" | "GET" | "PUT" | "PATCH" | "DELETE"
export type Handler = (data: Request) => Promise<Reply> | Reply
export type Middleware = (data: Request) => Promise<void>
export type OnRunningCallback = (host: string, port: number) => void
export type OnNotFoundCallback = (method: string, path: string) => Reply
/* Defining an interface. */
export interface Endpoint {
    route: string,
    method: Method,
    middlewares?: Middleware[],
    handler: Handler
}
/* Defining an interface. */
export interface Router {
    endpoints: Endpoint[],
    route: string
}
/* Defining an interface called Platform. */
export interface Platform {
    /* Defining a function called register that takes a string, a router, and an optional middleware. */
    register(path: string, router: Router, middlewares?: Middleware[]): void;
    /* Defining a function called listen that takes a string and a callback. */
    listen(port: string, callbacks?: { serverRunningCallback?: OnRunningCallback, notFoundCallback?: OnNotFoundCallback }): void;
}