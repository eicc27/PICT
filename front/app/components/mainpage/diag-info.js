import Component from '@glimmer/component';
// import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import ENV from 'front/config/environment';
import axios from 'axios';

/** Example response:
 *
 * {"system":"linux",
 * "browsers":[{"browser":"chromium","type":"playwright"},
 * {"browser":"firefox","type":"playwright"},
 * {"browser":"firefox","type":"system"},
 * {"browser":"chromium","type":"system"}]}
 */
export default class DiagInfoComponent extends Component {
    createInfo(
        info = 'info',
        parent = document.getElementsByClassName('diag-info')[0]
    ) {
        let li = document.createElement('li');
        li.innerHTML = info;
        parent.appendChild(li);
    }

    async checkBrowser() {
        // post to server
        let response = {
            browsers: [],
            system: '',
        };
        await axios
            .get(`${ENV.API_HOST}/check-browser`)
            .then((res) => {
                console.log(res.data);
                response = res.data;
            })
            .catch((err) => {
                console.log(err);
            });
        return response;
    }

    @action
    async startDiag() {
        let response = await this.checkBrowser();
        this.createInfo(
            `<div class="init-indicator-info"></div> You're now on ${response.system}.`
        );
        // checks browser info
        if (response.browsers.length === 0) {
            this.createInfo(
                `<div class="init-indicator-error"></div>No browser available!`
            );
        } else {
            let nativeFirefox = false;
            let playwrightFirefox = false;
            for (let i = 0; i < response.browsers.length; i++) {
                let browser = response.browsers[i];
                let info = '';
                if (browser.type == 'playwright') {
                    info = `<div class="init-indicator-ok"></div>Playwright ${browser.browser} found.`;
                    if (browser.browser == 'firefox') playwrightFirefox = true;
                } else {
                    info = `<div class="init-indicator-ok"></div>Native ${browser.browser} found.`;
                    if (browser.browser == 'firefox') nativeFirefox = true;
                }
                this.createInfo(info);
            }
            if (nativeFirefox && !playwrightFirefox) {
                this.createInfo(
                    `<div class="init-indicator-warning"></div>Native firefox was found but Playwright firefox is not installed.`
                );
                this.createInfo(
                    `<div class="init-indicator-warning"></div>Playwright need its own firefox to run properly.`
                );
                this.createInfo(
                    `<div class="init-indicator-warning"></div>Check Settings to manage your browsers.`
                );
            }
        }
    }
}
