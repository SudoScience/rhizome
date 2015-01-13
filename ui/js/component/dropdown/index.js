/* global window */

'use strict';

var _    = require('lodash');
var Vue  = require('vue');

var dom  = require('../../util/dom');
var util = require('../../util/data');

function treeify(data) {
	var index = _.indexBy(data, 'value');
	var roots = [];

	for (var i = data.length - 1; i >= 0; i--) {
		var d = data[i];

		if (d.parent && index[d.parent]) {
			var p = index[d.parent];

			if (!p.children) {
				p.children = [];
			}

			p.children.push(d);
		} else {
			roots.push(d);
		}
	}

	return roots;
}

module.exports = Vue.extend({
	template: require('./template.html'),

	// Object mapping property names of response objects to property names for the
	// VM. Useful for setting the 'title,' 'value,' and 'parent' properties of the
	// dropdown items.
	mapping: {},

	// (Optional) Function for fetching data.
	source: null,

	paramAttributes: [
		'loading',
		'multi',
		'placeholder',
		'searchable',
		'data-sort-dsc',
		'data-sort-by'
	],

	data: function () {
		return {
			pattern   : '',
			open      : false,
			opening   : false,
			menuHeight: 0,
			menuX     : 0,
			sortBy    : 'title',
			sortDsc   : false,
			items     : [],
			loading   : false
		};
	},

	ready: function () {
		this.searchable = util.parseBool(this.searchable);
		this.multi      = util.parseBool(this.multi);
		this.sortDsc    = util.parseBool(this.sortDsc);

		this.load();
	},

	computed: {

		filtered: function () {
			return this.pattern.length > 0;
		},

		selectedItems: function () {
			var selection = [];

			// Initial queue of items copied (hence [].concat) from the root items in
			// the dropdown. Using items directly as the queue results in empty menus
			// as the items are removed from the array.
			var q = [].concat(this.items || []);

			// Check all items and their children in a breadth-first manner
			while (q.length > 0) {
				var item = q.shift();

				if (item.selected) {
					selection.push(item);
				}

				q = q.concat(item.children || []);
			}

			return selection;
		},

		title: function () {
			var selected = this.selectedItems;

			return selected.length === 0 ? this.placeholder :
				selected.map(function (o) { return o.title; }).join(', ');
		},
	},

	methods: {
		toggle: function () {
			this.opening = this.open = !this.open;

			if (this.searchable) {
				var inpt = this.$el.getElementsByTagName('input')[0];

				// Reset the query
				this.pattern = '';

				if (this.open) {
					inpt.focus();
				}
			}

			if (this.open) {
				window.addEventListener('resize', this);
				window.addEventListener('click', this);
				window.addEventListener('keyup', this);
				this.invalidateSize();

				this.$el.getElementsByTagName('ul')[0].scrollTop = 0;
			} else {
				window.removeEventListener('resize', this);
				window.removeEventListener('click', this);
				window.removeEventListener('keyup', this);
			}
		},

		toggleItem: function (item) {
			this.$emit('dropdown-item-toggle', item);
		},

		handleEvent: function (evt) {
			switch (evt.type) {

			case 'keyup':
				// ESC
				if (evt.keyCode === 27) {
					this.open = false;
				}
				break;

			case 'click':
				if (this.opening) {
					this.opening = false;
				} else if (!dom.contains(this.$el.getElementsByClassName('container')[0], evt)) {
					this.open = false;
				}
				break;

			case 'resize':
				this.invalidateSize();
				break;

			default:
				break;

			}

		},

		invalidateSize: _.throttle(function () {
			var menu         = this.$el.getElementsByClassName('container')[0];
			var ul           = menu.getElementsByTagName('ul')[0];
			var style        = window.getComputedStyle(menu);
			var marginBottom = parseInt(style.getPropertyValue('margin-bottom'), 10);
			var marginRight  = parseInt(style.getPropertyValue('margin-right'), 10);
			var offset       = dom.viewportOffset(ul);
			var dims;

			if (this.multi) {
				dims          = dom.dimensions(menu.getElementsByClassName('selection-controls')[0], true);
				marginBottom += dims.height;
			}

			dims = dom.dimensions(menu);

			this.menuHeight = window.innerHeight - offset.top - marginBottom;
			this.menuX = Math.min(0, window.innerWidth - dom.viewportOffset(this.$el).left - dims.width - marginRight);
		}, 100, { leading: false }),

		clear: function () {
			this.$broadcast('dropdown-clear');
		},

		invert: function () {
			this.$broadcast('dropdown-invert');

		},

		selectAll: function () {
			this.$broadcast('dropdown-select-all');
		},

		load: function (params, accumulator) {
			if (!this.$options.source) {
				return;
			}

			params       = params || {};
			accumulator  = accumulator || [];

			var self     = this;
			var source   = self.$options.source;
			var mapping  = self.$options.mapping;

			self.loading = true;

			source(params)
				.then(function (data) {
					return {
						meta   : data.meta,
						errors : data.errors,
						objects: _.map(data.objects, function (v) {
							return _.defaults(util.rename(v, mapping), { selected: false });
						})
					};
				})
				.done(function (data) {
					var meta = data.meta;

					accumulator = accumulator.concat(data.objects);

					if (meta.limit !== 0 && meta.limit + meta.offset < meta.total_count) {
						self.load({
							limit : meta.limit,
							offset: meta.offset + meta.limit
						}, accumulator);
					} else {
						self.items   = treeify(accumulator);
						self.loading = false;
					}
				});
		}
	},

	filters: {

		flatten: function (arr) {
			var result = [];
			var q      = [].concat(arr);

			while (q.length > 0) {
				var item = q.shift();

				result.push(item);
				q = q.concat(item.children || []);
			}

			return result;
		},

	},

	events: {

		'dropdown-item-selected': function () {
			this.$emit('dropdown-value-changed', this.selectedItems);
		},

		'dropdown-item-toggle': function (item) {
			if (!this.multi) {
				this.$broadcast('dropdown-clear');
				item.selected = true;
			} else {
				item.selected = !item.selected;
			}

			this.$emit('dropdown-item-selected');
		}

	},

	components: {
		'dropdown-item': require('./item')
	}

});
