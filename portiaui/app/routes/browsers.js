import Ember from 'ember';

let browsers = [
    {
        name: 'Chrome',
        alt: 'Chrome logo',
        src: '/assets/images/chrome-logo.jpg',
        href: 'https://www.google.com/chrome/browser/desktop/'
    },
    {
        name: 'Firefox',
        alt: 'Firefox logo',
        src: '/assets/images/firefox-logo.png',
        href: 'https://www.mozilla.org/en-US/firefox/new/'
    }
];

export default Ember.Route.extend({
    model() {
        return browsers;
    }
});
