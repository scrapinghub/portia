import BaseRoute from './base-route';
import expetiments from '../utils/experiments';

export default BaseRoute.extend({
    fixedToolbox: true,

    model: function(){
        return [
        // {
        //     name: 'selectors',
        //     label: 'XPath and CSS selectors',
        //     helpText: 'Add custom XPath and CSS Selectors to a template',
        // }
        ].map((experiment) => {
            experiment.enabled = expetiments.enabled(experiment.name);
            experiment.newValue = experiment.enabled;
            return experiment;
        });
    },

    renderTemplate: function() {
        var controller = this.controllerFor('experiments');
        this.render('experiments', {
            into: 'application',
            outlet: 'main',
            controller: controller,
        });

        this.render('template/topbar', {
            into: 'application',
            outlet: 'topbar',
            controller: controller,
        });
    },
});
