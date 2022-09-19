import { MongoClient, UpdateOptions } from 'mongodb';
import { ENV } from '../../../config/environment';
import { Picture } from '../../../types/Types';
import { dbLogger, identifier } from '../../Logger';

export default class MongoConnector {
    private pictures: Picture[];

    public constructor(pictures: Picture[]) {
        this.pictures = pictures;
    }

    public async insert() {
        let connection = await MongoClient.connect(`mongodb://127.0.0.1:${ENV.MONGO.PORT}`);
        let pictureTable = connection.db('pixcrawl').collection('pictures');
        let options: UpdateOptions = {
            upsert: true
        };
        for (const picture of this.pictures) {
            let id = identifier();
            let filter = {
                'pid': picture.pid
            }
            let insertion = {$set: JSON.parse(JSON.stringify(picture))};
            dbLogger('Mongo', insertion.$set.pid, id, 'to');
            let res = await pictureTable.updateOne(filter, insertion, options);
            dbLogger('Mongo', insertion.$set.pid, id, 'from', res);
        }
        connection.close();
    }
}