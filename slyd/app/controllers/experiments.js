import BaseController from './base-controller';
import expetiments from '../utils/experiments';
import Ember from 'ember';
import NotificationManager from '../utils/notification-manager';

export default BaseController.extend({
    queryParams: ['updated'],

    changed: function(){
        return this.get('model').any(experiment => experiment.enabled !== experiment.newValue);
    }.property('model.@each.newValue'),
    notChanged: Ember.computed.not('changed'),

    actions: {
        save: function(){
            this.get('model').forEach(experiment => {
                expetiments.setEnabled(experiment.name, experiment.newValue);
            });
            // reload the page
            location.href = location.href.replace(/(\?[^?#]*)?$/, '?updated=1');
            location.reload();
        },
        cancel: function(){
            this.transitionTo('projects');
        },
    },

    willEnter: function(){
        Ember.run.next(()=>{
            if(this.get('updated')) {
                this.set('updated', null);
                NotificationManager.showSuccessNotification('Experiment preferences updated.');
                this.transitionToRoute('projects');
            }
            this.get('document.view').config({
                mode: 'none',
                blankPage: false,
            });
        });
    }
});
