import Service from '@ember/service';
import ENV from 'front/config/environment';

// TODO: All revise to refrence-passing mode. Write more HBS instead of JS.
export default class PixcrawlService extends Service {
    socket = new WebSocket(ENV.WS_HOST);
}
