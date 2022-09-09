import Service from '@ember/service';
import ENV from 'front/config/environment';


export default class PixcrawlService extends Service {
    socket = new WebSocket(ENV.WS_HOST);
}
