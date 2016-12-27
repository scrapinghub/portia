import Ember from 'ember';
const { computed, inject: { service } } = Ember;

export default Ember.Component.extend({
    tagName: '',

    store: service(),
    uiState: service(),
    dispatcher: service(),
    savingNotification: service(),
    notificationManager: service(),

    projects: [],
    isCopyingSpider: false,

    init() {
        this._super(...arguments);
        const projectId = this.get('project.id');
        this.set('projects',
                 this.get('store').peekAll('project').rejectBy('id', projectId));
    },

    currentSpider: computed.readOnly('uiState.models.spider'),

    downloadUrl: computed('currentSpider', function() {
        const link = this.get('currentSpider._internalModel._links.self');
        return `${link}/download`;
    }),
    downloadCodeUrl: computed('downloadUrl', function() {
        return `${this.get('downloadUrl')}?format=code`;
    }),

    notifyError(spider) {
        const msg = `Renaming the spider '${spider.get('id')}' failed.`;
        this.get('notificationManager').showErrorNotification(msg);
        spider.set('name', spider.get('id'));
    },

    actions: {
        validateSpiderName(spider, name) {
            const nm = this.get('notificationManager');
            if(!/^[a-zA-Z0-9][a-zA-Z0-9_\.-]*$/.test(name)) {
                nm.showWarningNotification(`Invalid spider name.
                    Only letters, numbers, underscores, dashes and dots are allowed.`);
                return false;
            }
            if (spider.get('id') === name) {
                return true;
            }
            const spiders = this.get('project.spiders').mapBy('id');
            if(spiders.indexOf(name) >= 0) {
                nm.showWarningNotification(`Invalid spider name.
                    A spider already exists with the name "${name}"`);
                return false;
            }
            return true;
        },
        removeSpider(spider) {
            this.get('dispatcher').removeSpider(spider);
        },
        saveSpiderName(spider) {
            const dispatcher = this.get('dispatcher');
            const saving = this.get('savingNotification');

            saving.start();

            dispatcher.changeSpiderName(spider)
                .then((data) => dispatcher.changeId(spider, data))
                .catch(() => this.notifyError(spider))
                .finally(() => saving.end());
        },
        closeSpiderOptions() {
            this.set('isCopyingSpider', false);
        },
        copySpider() {
            this.set('isCopyingSpider', true);
        },
        copyToProject(options, project) {
            project.copy({
                from: this.get('project.id'),
                data: [
                  { id: this.get('spider.id'), type: 'spiders' }
                ]
            }).then(this._copyProjectSuccess(project))
              .catch(this._copyProjectError.bind(this))
              .finally(this._afterCopyProject(options));
        }
    },

    _copyProjectSuccess(project) {
        return () => {
            const msg = `Spider ${this.get('spider.id')} copied
                        successfully to project ${project.get('name')}.`;
            this.get('notificationManager').showNotification(msg);
        };
    },
    _copyProjectError(data) {
        const error = data.errors[0];
        if (error.status > 499) {
            throw data;
        }
        this.get('notificationManager').showErrorNotification(error.title, error.detail);
    },
    _afterCopyProject(options) {
        return () => {
            options.closeMenu();
            this.set('isCopyingSpider', false);
        };
    }
});
