import EmberRouter from '@ember/routing/router';
import config from 'front/config/environment';

export default class Router extends EmberRouter {
    location = config.locationType;
    rootURL = config.rootURL;
}

Router.map(function () {
    this.route('home', { path: '/' });
    this.route('settings');
    this.route('fm');
    this.route('iris');
    this.route('pixcrawl');
    this.route('picture', { path: '/picture/:pid' });
});


