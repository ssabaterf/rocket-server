// deno-lint-ignore-file
import { serve } from "../deps.ts";
import { Handler, Middleware, Platform, Router, OnRunningCallback, OnNotFoundCallback } from "../types/platform.ts";
import * as Req from "../types/request.ts";
import * as Res from '../types/response.ts';

/* It's a class that takes a route and a handler and returns a response */
export class Rocket implements Platform {
    #routes: RouteNode = new RouteNode();
    constructor() {

    }
    /**
     * It takes a path, a router, and an array of middlewares, and then it loops through the router's
     * endpoints, and for each endpoint, it creates a pathname, converts the endpoint's method to an HTTP
     * method, creates an array of middlewares, and then it inserts the HTTP method, pathname, and the
     * middlewares and handler into the routes
     * @param {string} path - string - The path to the router.
     * @param {Router} router - Router - This is the router object that is passed to the register function.
     * @param {Middleware[]} middlewares - Middleware[] = []
     * @returns Nothing.
     */
    register(path: string, router: Router, middlewares: Middleware[]): void {
        for (const route of router.endpoints) {
            const pathname = `${path}/${router.route}/${route.route}`
                .replaceAll("//", "/")
                .replace(/^\/|\/$/g, "")
            const httpMiddlewares: Middleware[] = [...middlewares || [], ...route.middlewares || []];
            this.#routes.insert(
                route.method.toUpperCase(),
                pathname,
                { pattern: new URLPattern({ pathname }), middlewares: httpMiddlewares, handler: route.handler }
            );
            console.log(`Registering route ${route.method.toUpperCase()}\t${pathname}`);
        }
        return;
    }
    /**
     * `listen` is a function that takes a port number as a string and returns nothing.
     * 
     * @param {string} port - The port to listen on.
     */
    listen(port: string, callbacks?: { serverRunningCallback?: OnRunningCallback, notFoundCallback?: OnNotFoundCallback }) {
         return serve(async (req: Request) => {
            const init = Date.now();
            const notFound = callbacks?.notFoundCallback || ((method: string, path: string) => new Res.Reply(404, { message: 'Not Found', path: path, method: method }))
            const response = await this.route(req, notFound)
            console.log(`${req.method}\t${req.url}\t${response.status}\t${Date.now() - init}ms`);
            return response;
        }, {
            port: parseInt(port),
            onListen: ({ port, hostname }) => {
                if (callbacks?.serverRunningCallback) callbacks.serverRunningCallback(hostname, port)
            }
        });
    }
    /**
     * It takes a request, finds the matching route, and returns the response from the handler.
     * 
     * The first thing we do is get the path from the request. We do this by splitting the url on the
     * question mark, hash, and slashes. We then slice the array to get the path.
     * 
     * Next, we use the path to find the matching route. We do this by using the search method on the
     * routes object. This returns a node. If the node has data, we call the routeToHandler function. This
     * function returns a promise. We await the promise and then call the platformToRest function. This
     * function converts the response from the handler to a response that the platform can understand.
     * 
     * If there is no matching route, we return a not found response.
     * 
     * If there is an error, we return an internal server error response.
     * @param {Request} req - Request - The request object
     * @returns The return type is a Promise of a Response.
     */
    async route(req: Request, notFoundCallback?: OnNotFoundCallback): Promise<Response> {
        const path = "/" + req.url.split('?')[0].split('#')[0].split('/').slice(3).join('/');
        try {
            const node = this.#routes.search(req.method, path);
            if (node && node.data) {
                return this.platformToRest(await this.routeToHandler(req, node.data));
            }
        } catch (e) {
            const internalError = Res.InternalServerError(e);
            return this.platformToRest(internalError);
        }
        const notFound = notFoundCallback ? notFoundCallback(req.method, path) : Res.NotFound(null);
        return this.platformToRest(notFound);
    }
    /**
     * It takes a request, and a route, and then it runs the middlewares, and then it runs the handler, and
     * then it returns the response
     * @param {Request} req - Request - The request object from the http server
     * @param r - { pattern: URLPattern, middlewares: Middleware[], handler: Handler }
     * @returns The return type is a Promise of a Res.Reply.
     */
    private async routeToHandler(req: Request,
        r: { pattern: URLPattern, middlewares: Middleware[], handler: Handler }): Promise<Res.Reply> {
        try {
            const params = r.pattern.exec(req.url);
            const request: Req.Request = await this.restToPlatform(req, params);
            for (const middleware of r.middlewares) {
                await middleware(request);
            }
            const response = await r.handler(request);
            return response;
        } catch (error) {
            return this.handleError(error);
        }
    }
    private handleError(error: unknown): Res.Reply {
        console.error(error);
        return Res.BadRequest(error);
    }
    /**
     * It takes a response from the platform and converts it to a response that the REST API can
     * understand.
     * @param response - Res.Reply
     * @returns A Response object.
     */
    private platformToRest(response: Res.Reply): Response {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (response.headers) {
            for (const [key, value] of Object.entries(response.headers)) {
                headers[key] = value;
            }
        }
        return new Response(JSON.stringify(response.data), { status: response.status, headers: headers });
    }
    /**
     * It takes a request, and returns a request
     * @param {Request} req - Request - The request object from the client
     * @param {URLPatternResult | null} params - { ...body, ...path, ...query, ...headers }
     * @returns A promise of a Req.Request object.
     */
    private async restToPlatform(req: Request, params: URLPatternResult | null): Promise<Req.Request> {
        const query: { [key: string]: string } = {};
        if (params?.search?.groups && params?.search?.groups["0"]) {
            const search = params?.search?.groups["0"].split('&');
            for (const s of search) {
                const [key, value] = s.split('=');
                query[key] = value;
            }
        }
        return {
            request: req,
            protocol: req.url.startsWith('https') ? 'https' : 'http',
            path: req.url.split('?')[0].split('#')[0].split('/').slice(3).join('/'),
            url: req.url,
            method: req.method,
            headers: { ...Object.fromEntries(req.headers.entries()) },
            params: { ...params?.pathname?.groups },
            query: { ...query },
            body: { ...(req.method === "POST" ? await req.json() : {}) }
        };
    }
}
/* It's a tree where each node has a map of children, and the key of each child is either a path
segment or a parameter */

class RouteNode {
    children: Map<string, RouteNode>;
    data: { pattern: URLPattern, middlewares: Middleware[], handler: Handler } | null;

    constructor() {
        this.children = new Map<string, RouteNode>();
        this.data = null;
    }

    /**
     * It takes a method, a path, and a handler, and inserts the handler into the tree
     * @param {string} method - The HTTP method (GET, POST, PUT, DELETE, etc.)
     * @param {string} path - The path to the route, e.g. /user/:id
     * @param data - { pattern: URLPattern, middlewares: Middleware[], handler: Handler }
     */
    insert(method: string, path: string, data: { pattern: URLPattern, middlewares: Middleware[], handler: Handler }): void {
        let currentNode: RouteNode = this;
        for (const segment of path.split("/")) {
            if (!segment) continue;
            const subPath = segment.startsWith(":") ? "<parameter>" : segment;
            let child = currentNode.children.get(subPath);
            if (!child) {
                child = new RouteNode();
                currentNode.children.set(subPath, child);
            }
            currentNode = child;
        }
        const node = new RouteNode()
        node.data = data;
        currentNode.children.set(method, node);
    }

    /**
     * "Search for a route node that matches the given method and path."
     * 
     * The function starts by creating a variable called `currentNode` and assigning it to the current
     * node. This is the node that the function will start searching from
     * @param {string} method - The HTTP method of the request.
     * @param {string} path - The path to search for.
     * @returns The child of the current node.
     */
    search(method: string, path: string): RouteNode | null {
        let currentNode: RouteNode = this;
        const pathSegments = path.split("/");
        for (let i = 0; i < pathSegments.length; i++) {
            const segment = pathSegments[i];
            if (!segment) continue;
            let child = currentNode.children.get(segment);
            if (!child) {
                child = currentNode.children.get("<parameter>");
                if (!child) return null;
            }
            currentNode = child;
        }
        const child = currentNode.children.get(method);
        return child || null;
    }
}
