import * as WebSocket from "ws"; 

export default interface ISearchHandler {
    keyword: string;
    search: () => Promise<unknown>;
    extendedSearch: (...args: unknown[]) => Promise<unknown>;
}