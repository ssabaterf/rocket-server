import { Assert, Mock } from "./deps.ts";
import { Rocket } from "./server/rocket.ts";
import { BadRequest, Created, Forbidden, InternalServerError, NotFound, OK, Reply, ResponseCodes, Unauthorized } from "./types/response.ts";
import { Handler, Router, OnNotFoundCallback } from './types/platform.ts';

const body = { hello: "world" };
const headers = { "content-type": "application/json" };

Deno.test("Reply class", () => {
    const reply = new Reply(ResponseCodes.OK, body, headers);
    Assert.assertExists(reply);
    Assert.assertEquals(reply.status, ResponseCodes.OK);
    Assert.assertEquals(reply.data, body);
    Assert.assertEquals(reply.headers, headers);
});

Deno.test("OK Response", () => {
    const reply = OK(body, headers);
    Assert.assertExists(reply);
    Assert.assertEquals(reply.status, ResponseCodes.OK);
    Assert.assertEquals(reply.data, body);
    Assert.assertEquals(reply.headers, headers);
});

Deno.test("Created Response", () => {
    const reply = Created(body, headers);
    Assert.assertExists(reply);
    Assert.assertEquals(reply.status, ResponseCodes.Created);
    Assert.assertEquals(reply.data, body);
    Assert.assertEquals(reply.headers, headers);
});

Deno.test("BadRequest Response", () => {
    const reply = BadRequest(body, headers);
    Assert.assertExists(reply);
    Assert.assertEquals(reply.status, ResponseCodes.BadRequest);
    Assert.assertEquals(reply.data, body);
    Assert.assertEquals(reply.headers, headers);
});

Deno.test("NotFound Response", () => {
    const reply = NotFound(body, headers);
    Assert.assertExists(reply);
    Assert.assertEquals(reply.status, ResponseCodes.NotFound);
    Assert.assertEquals(reply.data, body);
    Assert.assertEquals(reply.headers, headers);
});

Deno.test("Forbidden Response", () => {
    const reply = Forbidden(body, headers);
    Assert.assertExists(reply);
    Assert.assertEquals(reply.status, ResponseCodes.Forbidden);
    Assert.assertEquals(reply.data, body);
    Assert.assertEquals(reply.headers, headers);
});

Deno.test("Unauthorized Response", () => {
    const reply = Unauthorized(body, headers);
    Assert.assertExists(reply);
    Assert.assertEquals(reply.status, ResponseCodes.Unauthorized);
    Assert.assertEquals(reply.data, body);
    Assert.assertEquals(reply.headers, headers);
});

Deno.test("Internal Server Response", () => {
    const reply = InternalServerError(body, headers);
    Assert.assertExists(reply);
    Assert.assertEquals(reply.status, ResponseCodes.InternalServerError);
    Assert.assertEquals(reply.data, body);
    Assert.assertEquals(reply.headers, headers);
});


Deno.test("Routing Server Instance", async () => {
    const handler: Handler = (_) => OK(body);
    const notFound: OnNotFoundCallback = (_method: string, _path: string) => new Reply(ResponseCodes.NotFound, { message: "Not Found" });

    const spyHandler = Mock.spy(handler);
    const spyNotFound = Mock.spy(notFound);

    const router: Router = {
        route: "test",
        endpoints: [
            {
                route: "/",
                method: "POST",
                middlewares: [],
                handler: spyHandler
            },
            {
                route: "/:id",
                method: "PUT",
                middlewares: [],
                handler: spyHandler
            },
            {
                route: "/:id",
                method: "PATCH",
                middlewares: [],
                handler: spyHandler
            },
            {
                route: "/",
                method: "DELETE",
                middlewares: [],
                handler: spyHandler
            },
            {
                route: "/:id",
                method: "GET",
                middlewares: [],
                handler: spyHandler
            },
            {
                route: "/",
                method: "GET",
                middlewares: [],
                handler: spyHandler
            },
        ],
    }
    const app = new Rocket();
    app.register("/api",router, [])

    const POST = new Request("http://localhost:3000/api/test", {body: JSON.stringify(body), method:"POST",headers});
    const PUT = new Request("http://localhost:3000/api/test/123", {body: JSON.stringify(body), method:"PUT",headers});
    const PATCH = new Request("http://localhost:3000/api/test/123", {body: JSON.stringify(body), method:"PATCH",headers});
    const DELETE = new Request("http://localhost:3000/api/test", {body: JSON.stringify(body), method:"DELETE",headers});
    const GET = new Request("http://localhost:3000/api/test/123", {method:"GET",headers});
    const GET2 = new Request("http://localhost:3000/api/test", {method:"GET",headers});
    const POSTNF = new Request("http://localhost:3000/api/test/asdasd", {body: JSON.stringify(body), method:"POST",headers});
    const GETNF = new Request("http://localhost:3000/api/user", {method:"GET",headers});

    const rPOST = await app.route(POST, spyNotFound);
    const rPUT = await app.route(PUT, spyNotFound);
    const rPATCH = await app.route(PATCH, spyNotFound);
    const rDELETE = await app.route(DELETE, spyNotFound);
    const rGET = await app.route(GET, spyNotFound);
    const rGET2 = await app.route(GET2, spyNotFound);
    const rPOSTNF = await app.route(POSTNF, spyNotFound);
    const rGETNF = await app.route(GETNF, spyNotFound);

    Assert.assertEquals(rPOST.status, ResponseCodes.OK);
    Assert.assertEquals(rPUT.status, ResponseCodes.OK);
    Assert.assertEquals(rPATCH.status, ResponseCodes.OK);
    Assert.assertEquals(rDELETE.status, ResponseCodes.OK);
    Assert.assertEquals(rGET.status, ResponseCodes.OK);
    Assert.assertEquals(rGET2.status, ResponseCodes.OK);
    Assert.assertEquals(rPOSTNF.status, ResponseCodes.NotFound);
    Assert.assertEquals(rGETNF.status, ResponseCodes.NotFound);

    Assert.assertEquals(spyHandler.calls.length, 6);
    Assert.assertEquals(spyNotFound.calls.length, 2);
});