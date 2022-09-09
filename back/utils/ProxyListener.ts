import { getProxySettings, ProxySetting } from 'get-proxy-settings';
import httpsProxyAgent from 'https-proxy-agent';
import { ENV } from '../config/environment';
import Logger, { SigLevel } from './Logger';

/** Listen for the system proxy to start. Only activated on Windows. */
export default class ProxyListener {
    private interval = 5;
    private first = true;
    public proxy: ProxySetting;

    public listen() {
        (new Logger(`Listening proxy changes at an interval of ${this.interval}s...`)).log();
        ENV.PROXY_AGENT = null;
        let listener = setInterval(async () => {
            let settings = await getProxySettings();
            if (this.first) {
                this.first = false;
                if (settings)
                    (new Logger(`Proxy port detected at ${this.proxy}`, SigLevel.ok)).log();
                else
                    (new Logger(`Proxy port closed!`, SigLevel.warn)).log();
            }
            if (settings && !this.proxy) {
                this.proxy = settings.https;
                // clearInterval(listener);
                ENV.PROXY_AGENT = httpsProxyAgent(this.proxy);
                (new Logger(`Proxy port detected at ${this.proxy}`, SigLevel.ok)).log();
                return;
            } else if (!settings && this.proxy) {
                this.proxy = null;
                ENV.PROXY_AGENT = null;
                (new Logger(`Proxy port closed!`, SigLevel.warn)).log();
            }
        }, this.interval * 1000);
    }
}