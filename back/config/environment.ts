import Account from './account';
import Browser from './browser';

export default class ENV {

    /**
     * Used to test Internet connection in web interface `/check-network`.
     */
    static TEST_WEBSITE = 'https://www.pixiv.net';

    static PIXIV = {
        root: 'https://www.pixiv.net',
        user: 'https://www.pixiv.net/setting_user.php',
    };

    static BROWSER = new Browser();

    static ACCOUNT = new Account();
}