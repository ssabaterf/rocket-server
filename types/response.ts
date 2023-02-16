/* A class that cannot be instantiated. It is used to define a common interface for all the classes
that extend it. */
class Reply {
    status: number;
    data: unknown;
    headers: { [key: string]: string }
    constructor(status: number, data: unknown, headers: { [key: string]: string }={}) {
        this.status = status;
        this.data = data;
        this.headers = headers;
    }
}
/* A constant object that contains the HTTP response codes. */
const ResponseCodes = {
    OK: 200,
    Created: 201,
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    InternalServerError: 500,
}
/**
 * The above functions are used to create an ErrorResponse or SuccessResponse object, which is then
 * returned to the client.
 * @param {unknown} detail - The error detail. This is the error object that is thrown.
 * @returns An object with a statusCode and a body.
 */

function Unauthorized(detail: unknown, headers: { [key: string]: string } = {}): Reply {
    return new Reply(ResponseCodes.Unauthorized, detail, headers)
}

/**
 * It returns a new instance of the ErrorResponse class, with the ResponseCodes.Forbidden enum value,
 * the message string, and the detail object
 * @param {unknown} detail - The error detail. This is the error object that is returned to the client.
 * @returns An ErrorResponse object
 */
function Forbidden(detail: unknown, headers: { [key: string]: string } = {}): Reply {
    return new Reply(ResponseCodes.Forbidden, detail, headers)
}
/**
 * It returns a new instance of the ErrorResponse class, with the ResponseCodes.NotFound enum value,
 * the message string, and the detail object
 * @param {unknown} detail - The error detail. This is the error object that was thrown.
 * @returns An ErrorResponse object
 */
function NotFound(detail: unknown, headers: { [key: string]: string } = {}): Reply {
    return new Reply(ResponseCodes.NotFound, detail, headers)
}
/**
 * It returns a new instance of the ErrorResponse class, with the ResponseCodes.InternalServerError
 * enum value, the message string, and the detail object
 * @param {unknown} detail - This is the error object that is returned from the API.
 * @returns An ErrorResponse object.
 */
function InternalServerError(detail: unknown, headers: { [key: string]: string } = {}): Reply {
    return new Reply(ResponseCodes.InternalServerError, detail, headers)
}
/**
 * It returns a new instance of the ErrorResponse class, with the ResponseCodes.BadRequest enum value,
 * the message string, and the detail object
 * @param {unknown} detail - The error detail. This is the error object that is returned to the client.
 * @returns An ErrorResponse object
 */
function BadRequest(detail: unknown, headers: { [key: string]: string } = {}): Reply {
    return new Reply(ResponseCodes.BadRequest, detail, headers)
}
/**
 * It takes a parameter of type `unknown` and returns a `SuccessResponse` object.
 * @param {unknown} body - unknown
 * @returns A SuccessResponse object with a body of type unknown.
 */
function OK(body: unknown, headers: { [key: string]: string } = {}): Reply {
    return new Reply(ResponseCodes.OK, body, headers)
}
/**
 * It takes an unknown type and returns a SuccessResponse
 * @param {unknown} body - The body of the response.
 * @returns A SuccessResponse object with a body of type unknown.
 */
function Created(body: unknown, headers: { [key: string]: string } = {}): Reply {
    return new Reply(ResponseCodes.Created, body, headers)
}

export { ResponseCodes, Created, Unauthorized, Forbidden, NotFound, InternalServerError, OK, BadRequest, Reply }