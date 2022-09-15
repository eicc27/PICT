import { Picture } from "../../types/Types";
import { SQLColumnType } from "../DBConnector/SQLiteConnector";


/**
 * Parses the Picture-like object into SQL-like column map.
 * 
 * For the `time` column of the table, it is parsed like below:
 * 
 * [original]
 * `https://i.pximg.net/img-master/img/2022/09/05/13/04/49/101013633_p0_master1200.jpg`
 * 
 * [sql][text]
 * `2022-09-05 13:04:49`
 * 
 */
export default class DataParser<V extends Picture> {
    private picture: V;

    public constructor(picture: V) {
        this.picture = picture;
    }

    private parseTime() {
        let original = this.picture.originalUrls[0];
        let datetime = original.split('/').slice(5, 11);
        let ymd = datetime.slice(0, 3);
        let hms = datetime.slice(3);
        return `${ymd.join('-')} ${hms.join(':')}`;
    }

    /**
     * Parses a part of picture to table map: Pid <-> Uid <-> Pname <-> Time
     */
    public toPidTableMap(): Map<string, SQLColumnType> {
        let map = new Map<string, SQLColumnType>;
        map.set('pid', {
            value: this.picture.pid,
            nn: true,
            pri: true
        });
        map.set('pname', {
            value: this.picture.pname,
            nn: true
        });
        map.set('uid', {
            value: this.picture.uid,
            nn: true,
            // foreign: true,
            // ref: 'UID(uid)'
        });
        map.set('time', {
            value: this.parseTime(),
            nn: true
        });
        return map;
    }

    /**
     * Parses a part of picture to table map: Pid <-> Tag
     */
    public toTagTableMap(): Map<string, SQLColumnType>[] {
        let ret = [];
        for (const tag of this.picture.tags) {
            let map = new Map<string, SQLColumnType>();
            map.set('pid', {
                value: this.picture.pid,
                nn: true,
                foreign: true,
                ref: 'PID(pid)',
            });
            map.set('tag', {
                value: tag,
                nn: true,
            })
            ret.push(map);
        }
        return ret;
    }

    public toUrlTableMap(): Map<string, SQLColumnType>[] {
        let ret = [];
        for (const url of this.picture.originalUrls) {
            let map = new Map<string, SQLColumnType>();
            map.set('pid', {
                value: this.picture.pid,
                nn: true,
                foreign: true,
                ref: 'PID(pid)',
            });
            map.set('url', {
                value: url,
                nn: true,
            });
            ret.push(map);
        }
        return ret;
    }

    public toUidTableMap(): Map<string, SQLColumnType> {
        let map = new Map<string, SQLColumnType>();
        map.set('uid', {
            value: this.picture.uid,
            nn: true,
            pri: true,
        });
        map.set('uname', {
            value: this.picture.uname,
            nn: true,
        })
        return map;
    }
}

