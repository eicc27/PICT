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
});

Router.map(function () {
    this.route('pixcrawl', function () {
        this.route('keyword');
        this.route('index');
        this.route('search');
        this.route('download');
    });
});
