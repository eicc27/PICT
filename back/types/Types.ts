enum KEYWORD_TYPE { UID = 'uid', UNAME = 'uname', TAG = 'tag', PID = 'pid' };

enum REQUEST_TYPE { search = 'search', extendedSearch = 'extendedSearch', download = 'download' };

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

export { KEYWORD_TYPE, KeywordType, REQUEST_TYPE, RequestType };