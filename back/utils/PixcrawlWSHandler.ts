export default class PixcrawlWSHandler {
    private data;

    constructor(msg: any) {
        this.data = msg;
    }
    
    public handle() {
        if(this.data.type == 'search')
            return this.search();
    }

    private search() {
        return 'Keyword recieved.';
    }
}