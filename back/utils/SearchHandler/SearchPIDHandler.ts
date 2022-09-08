import ISearchHandler from "./ISearchHandler";

export default class SearchPIDHandler implements ISearchHandler {
    public keyword: string;

    public constructor(pid: string) {
        this.keyword = pid;
    }

    public async search() {
        
    }

    public async extendedSearch() {

    }
}