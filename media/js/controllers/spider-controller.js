ASTool.SpiderController = Em.ObjectController.extend(ASTool.RouteBrowseMixin, {
	
	needs: ['application', 'annotations'],

	documentView: null,

	newStartUrl: '',

	newExcludePattern: '',

	browseHistory: [],

	pageMap: {},

	loadedPageFp: null,

	hasStartUrl: function() {
		return !this.get('newStartUrl');
	}.property('newStartUrl'),

	hasExcludePattern: function() {
		return !this.get('newExcludePattern');
	}.property('newExcludePattern'),

	hasFollowPattern: function() {
		return !this.get('newFollowPattern');
	}.property('newFollowPattern'),

	displayLinksToFollow: function() {
		return this.content.get('links_to_follow') == 'patterns';
	}.property('model.links_to_follow'),

	showCrawlGraph: function(key, show) {
		if (!ASTool.graph) {
			return false;
		}
		if (arguments.length > 1) {
            if (show) {
                ASTool.graph.set('hidden', false);
            } else {
                ASTool.graph.set('hidden', true);
            }
        }
        return  !ASTool.graph.get('hidden');
	}.property('ASTool.graph.hidden'),

	_showLinks: true,

	showLinks: function(key, show) {
		if (arguments.length > 1) {
            if (show) {
                this.set('_showLinks', true);
            } else {
                this.set('_showLinks', false);
            }
        }
        return  this.get('_showLinks');
	}.property('_showLinks'),

	showItems: false,

	addTemplateDisabled: function() {
		return !this.get('loadedPageFp');
	}.property('loadedPageFp'),

	browseBackDisabled: function() {
		return this.get('browseHistory').length <= 1;
	}.property('browseHistory.@each'),

	showItemsDisabled: function() {
		var loadedPageFp = this.get('loadedPageFp');
		if (this.pageMap[loadedPageFp]) {
			return !loadedPageFp ? true : !this.pageMap[loadedPageFp].items.length;	
		}
		return true;
	}.property('loadedPageFp'),

	extractedItems: function() {
		var items = [];
		var loadedPageFp = this.get('loadedPageFp');
		if (this.pageMap[loadedPageFp]) {
			items = this.pageMap[loadedPageFp].items;	
		}
		return items.toArray();
	}.property('loadedPageFp'),

	spiderDomains: function() {
		var spiderDomains = new Em.Set();
		this.get('content.start_urls').forEach(function(startUrl) {
			spiderDomains.add(URI.parse(startUrl)['hostname']);
		});
		return spiderDomains;
	}.property('content.start_urls.@each'),

	sprites: function() {
		if (!this.get('loadedPageFp') || !this.get('showLinks')) {
			return [];
		}
		var currentPageData = this.get('pageMap')[this.get('loadedPageFp')];
		var allLinks = $($('#scraped-doc-iframe').contents().get(0).links);
		var followedLinks = currentPageData.links;
		var sprites = [];
		allLinks.each(function(i, link) {
			var followed = followedLinks.indexOf(link.href) >= 0 &&
				this.get('spiderDomains').contains(URI.parse(link.href)['hostname']);
			sprites.pushObject(ASTool.ElementSprite.create({
				element: link,
				hasShadow: false,
				fillColor: followed ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)',
				strokeColor: 'rgba(50, 50, 50, 1)' }));
		}.bind(this));
		return sprites;
	}.property('loadedPageFp', 'showLinks', 'spiderDomains'),

	editTemplate: function(template) {
		this.set('controllers.annotations.template', template);
		this.pushRoute('annotations', 'Template: ' + template.get('templateName'));
	},

	loadTemplate: function(template) {
		var pageFp = template.get('page_id');
		this.set('loadedPageFp', pageFp);
		this.pageMap[pageFp] = { page: template.get('original_body'),
								 url: template.get('url'),
								 fp: template.get('page_id') };
		this.get('browseHistory').pushObject(pageFp);
		this.get('documentView').displayAnnotatedDocument(template.get('original_body'));
	},

	fetchPage: function(url, parentFp) {
		this.set('loadedPageFp', null);
		var documentView = this.get('documentView');
		documentView.showLoading();
		this.get('slyd').fetchDocument(url, this.content.get('name')).then(function(data) {
			documentView.hideLoading();
			if (!data.error) {
				data.url = url;
				this.get('browseHistory').pushObject(data.fp);
				documentView.displayAnnotatedDocument(data.page,
					function(docIframe){
						this.get('documentView').reset();
						this.get('documentView').config({ mode: 'browse',
										  listener: this,
										  dataSource: this });
						this.set('loadedPageFp', data.fp);
						this.get('pageMap')[data.fp] = data;
						if (ASTool.graph) {
							ASTool.graph.addPage(data, parentFp);
						}
					}.bind(this)
				);
			} else {
				documentView.showError(data.error);
			}
		}.bind(this));
	},

	displayPage: function(fp) {
		this.set('loadedPageFp', null);
		var documentView = this.get('documentView');
		documentView.displayAnnotatedDocument(this.get('pageMap')[fp].page,
			function(){
				this.get('documentView').reset();		
				this.get('documentView').config({ mode: 'browse',
					listener: this,
					dataSource: this });
				this.set('loadedPageFp', fp);
			}.bind(this));
	},

	addTemplate: function() {
		var template = this.store.createRecord('template', 
			{ 'id': ASTool.guid(),
			  'extractors': {} });
		this.content.get('templates').pushObject(template);
		this.get('controllers.annotations').deleteAllAnnotations();
		var page = this.get('pageMap')[this.get('loadedPageFp')];
		template.set('annotated_body', page.page);
		template.set('original_body', page.page);
		template.set('page_id', page.fp);
		template.set('url', page.url);
		this.editTemplate(template);
	},

	addStartUrl: function(url) {
		var parsedUrl = URI.parse(url);

		if (!parsedUrl.protocol) {
			parsedUrl.protocol = 'http';
			url = URI.build(parsedUrl);
		}
		this.content.get('start_urls').pushObject(url);
		return url;
	},

	addExcludePattern: function(pattern) {
		this.content.get('exclude_patterns').pushObject(pattern);
	},

	addFollowPattern: function(pattern) {
		this.content.get('follow_patterns').pushObject(pattern);
	},

	saveSpider: function() {
		return this.content.save();
	},
	
	actions: {

		editTemplate: function(template) {
			this.editTemplate(template);
		},

		addTemplate: function() {
			this.addTemplate();
		},

		deleteTemplate: function(template) {
			this.content.get('templates').removeObject(template);
		},

		loadTemplate: function(template) {
			this.loadTemplate(template);
		},

		saveSpider: function() {
			this.saveSpider().then(function() {
				if (this.get('loadedPageFp')) {
					this.fetchPage(
						this.get('pageMap')[this.get('loadedPageFp')].url);
				}
			}.bind(this));
		},

		fetchPage: function(url) {
			// TODO: remove save on fetch.
			this.get('documentView').showLoading();
			this.saveSpider().then(function() {
				this.fetchPage(url);	
			}.bind(this));
		},

		browseBack: function() {
			var history = this.get('browseHistory');
			history.removeAt(history.length - 1);
			var lastPageFp = history.get('lastObject');
			this.displayPage(lastPageFp);
		},

		addStartUrl: function() {
			this.addStartUrl(this.get('newStartUrl'));
			this.set('newStartUrl', '');
		},

		deleteStartUrl: function(url) {
			this.content.get('start_urls').removeObject(url);
		},

		addExcludePattern: function() {
			this.addExcludePattern(this.get('newExcludePattern'));
			this.set('newExcludePattern', '');
		},

		editExcludePattern: function() {
			//TODO: implement this.
		},

		deleteExcludePattern: function(pattern) {
			this.content.get('exclude_patterns').removeObject(pattern);
		},

		addFollowPattern: function() {
			this.addFollowPattern(this.get('newFollowPattern'));
			this.set('newFollowPattern', '');
		},

		deleteFollowPattern: function(pattern) {
			this.content.get('follow_patterns').removeObject(pattern);
		},

		toggleShowItems: function() {
			this.set('showItems', !this.get('showItems'));
		},

		rename: function(oldName, newName) {
			if (confirm('Are you sure you want to rename this spider? This operation cannot be undone.')) {
				this.get('slyd').renameSpider(oldName, newName).then(
					function() {
						this.updateTop('Spider: ' + newName);
					}.bind(this),
					function(reason) {
						this.set('id', oldName);
						alert('The name ' + newName + ' is not a valid spider name.');
					}.bind(this)
				);
			} else {
				this.set('id', oldName);
			}
		},

		undoChanges: function() {
			if (confirm('Are you sure you want to abandon your changes?')) {
				this.content.rollback();
				this.content.reload();
			}
		},
	},

	documentActions: {

		linkClicked: function(url) {
			var parsedUrl = URI.parse(url);
			var parsedCurrentUrl = URI.parse(this.get('pageMap')[this.get('loadedPageFp')].url);

			if (!parsedUrl.protocol) {
				if (url.indexOf('/') == 0) {
					parsedCurrentUrl.path = parsedUrl.path.substring(1);
				} else {
					parsedCurrentUrl.path += parsedUrl.path;	
				}
				url = URI.build(parsedCurrentUrl);
			}
			// TODO: remove save on fetch.
			this.get('documentView').showLoading();
			this.saveSpider().then(function() {
				this.fetchPage(url, this.get('loadedPageFp'));	
			}.bind(this));
		}
	},

	willEnter: function() {
		this.get('browseHistory').setObjects([]);
		this.set('pageMap', {});
		this.set('loadedPageFp', null);
		this.get('documentView').config({ mode: 'browse',
										  listener: this,
										  dataSource: this });
		this.get('documentView').showSpider();
		if (!ASTool.graph) {
			ASTool.set('graph', ASTool.CrawlGraph.create());
		}
		ASTool.graph.set('hidden', true);
		var newProjectSite = this.get('controllers.application.newProjectSite')
		if (newProjectSite) {
			Ember.run.next(this, function() {
				this.fetchPage(this.addStartUrl(newProjectSite));
				this.set('controllers.application.newProjectSite', null);
				this.saveSpider();
			});
		}
		Ember.run.next(this, function() {
			$('#page-browser').trigger('click');	
		});
	},

	willLeave: function() {
		ASTool.graph.clear();
		ASTool.graph.set('hidden', true);
	},
});