import Ember from 'ember';

let browsers = [
    {
        src: '/assets/images/chrome-logo.jpg',
        alt: 'Chromo logo',
        href: 'https://www.google.com/chrome/browser/desktop/'
    },
    {
        src: '/assets/images/firefox-logo.png',
        alt: 'Firefox logo',
        href: 'https://www.mozilla.org/en-US/firefox/new/'
    }
];

export default Ember.Route.extend({
    model() {
        return browsers;
    }
});
