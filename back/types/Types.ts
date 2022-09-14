import { RESULT } from "../config/environment";

enum KEYWORD_TYPE { UID = 'uid', UNAME = 'uname', TAG = 'tag', PID = 'pid' };

enum REQUEST_TYPE { search = 'search', extendedSearch = 'extendedSearch', crawl = 'crawl', download = 'download' };

class KeywordType {
    type: KEYWORD_TYPE;
    value: string;
    index: number;
    dropdown?: any[];
}

class RequestType {
    value: KeywordType[];
    type: REQUEST_TYPE;
}

class ExtendedRequestType {
    value: any;
    type: REQUEST_TYPE;
}

class CrawlResult {
    result: RESULT;
    index?: number;
    pics?: Picture[];
}

/** A picture is related to 4 tables. Pid<->Uid<->Pname, Pid<->Tag, Pid<->Url, Uid<->Uname  */
class Picture {
    pid: string;
    pname: string;
    uid: string;
    uname: string;
    tags: string[];
    originalUrls: string[];
}

export { KEYWORD_TYPE, KeywordType, REQUEST_TYPE, RequestType, ExtendedRequestType, CrawlResult, Picture };