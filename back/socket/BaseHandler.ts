import { Socket } from "./Socket.js";

export class BaseHandler {
    protected socket: Socket;
    public constructor(socket: Socket) {
        this.socket = socket;
    }
    public async handle() {
        throw new EvalError("This handle function must be overridden.");
    }
}
