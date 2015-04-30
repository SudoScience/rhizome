'use strict';

var _      = require('lodash');
var d3     = require('d3');

var color  = require('util/color');
var legend = require('./renderer/legend');

module.exports = {

	replace : true,
	template: require('./bar.html'),

	mixins: [
		require('./mixin/margin'),
		require('./mixin/resize')
	],

	paramAttributes: [
		'data-format',
		'data-labels',
		'data-tick-count',
		'data-click-event'
	],

	data: function () {
		return {
			aspect       : false, // Disable auto-setting height
			barHeight    : 14,
			chartType    : 'grouped-bar',
			format       : 's',
			marginTop    : 9,
			marginRight  : 18,
			marginBottom : 18,
			marginLeft   : 80,
			padding      : 1,
			series       : [],
			labels       : true,
			tickCount    : 3,
			clickEvent   : 'bar-click'
		};
	},

	computed: {
		empty: function () {
			return !this.series || this.series.length < 1;
		},

		height: function () {
			var l       = this.categories().length * this.series.length;
			var padding = l * this.padding;
			var h       = Math.max(0, l * this.barHeight + padding);

			return h + Number(this.marginTop) + Number(this.marginBottom);
		}
	},

	methods: {
		categories: function (series, seriesIdx) {
			if (arguments.length < 1) {
				series = this.series;
			}

			// Short circuit (no disassemble number 5!)
			if (!series || series.length < 1) {
				return [];
			}

			var order = _(series[seriesIdx || 0].values)
				.sortBy('x')
				.pluck('y')
				.value();

			return _(series)
				.pluck('values')
				.flatten()
				.pluck('y')
				.uniq()
				.sortBy(function (n) {
					return order.indexOf(n);
				})
				.value();
		},

		draw: function () {
			var self = this;
			var svg  = d3.select(this.$el);

			var data = _(this.series)
				.pluck('values')
				.flatten();

			var xScale = d3.scale.linear()
				.range([0, this.contentWidth])
				.clamp(true);

			if (this.domain) {
				xScale.domain(this.domain);
			} else {
				xScale.domain([0, d3.max(data.value(), function (d) {
					return d.x;
				})]);
			}

			var x = function (d) {
				return xScale(d.x);
			};

			var yScale = d3.scale.ordinal()
				.domain(this.categories())
				.rangePoints([this.contentHeight, 0], this.padding);

			var y = function (d) {
				return yScale(d.y);
			};

			var series = svg.select('.data')
				.selectAll('.series')
				.data(this.series, function (d) {
					return d.name;
				});

			series.enter().append('g').attr('class', 'series');

			var height = this.barHeight;
			var groupHeight = height * this.series.length;

			series.attr('transform', function (d, i) {
				return 'translate(0,' + ((i * height) - groupHeight / 2) + ')';
			});

			var colorScale = this._color;
			var fmt        = d3.format(this.format);
			var showLabels = JSON.parse(this.labels);

			series.each(function (datum) {
				var g   = d3.select(this);

				var bar = g.selectAll('.bar')
					.data(datum.values);

				var barEnter = bar.enter()
					.append('g')
					.attr('class', 'bar');

				barEnter.append('rect')
					.attr('width', 0);

				if (showLabels) {
					barEnter.append('text')
						.attr({
							'class' : 'label',
							'x'     : '0.1em',
							'y'     : height / 2,
							'dy'    : '0.35em'
						});
				}

				bar.select('rect')
					.transition()
					.duration(300)
					.attr({
						'fill'   : colorScale(datum.name),
						'height' : height,
						'width'  : x,
					});

				if (showLabels) {
					bar.select('text')
						.text(function (d) {
							return fmt(d.x);
						})
						.transition()
						.duration(300)
						.attr('y', height / 2)
						.each(function (d) {
							var bbox = this.getBBox();
							var invertFill = bbox.width <= x(d);

							d3.select(this)
								.attr('fill', invertFill ? '#fff' : null)
								.style('text-shadow', invertFill ? 'none' : null);
						});
				} else {
					bar.select('text').remove();
				}

				bar
					.on('click', function (d) {
						self.$dispatch(self.clickEvent, d);
					})
					.transition()
					.duration(300)
					.attr('transform', function (d) {
						return 'translate(0,' + y(d) + ')';
					});

				var t = bar.exit().transition().duration(300);

				t.select('rect').attr('width', 0);
				t.remove();
			});

			series.exit()
				.transition()
				.duration(300)
				.style('opacity', 0)
				.remove();

			var xAxis = d3.svg.axis()
				.orient('bottom')
				.tickSize(-this.contentHeight)
				.ticks(Number(this.tickCount))
				.tickFormat(fmt)
				.tickPadding(6)
				.scale(xScale);

			svg.select('.x.axis')
				.call(xAxis);

			var yAxis = d3.svg.axis()
				.orient('left')
				.tickSize(0)
				.tickPadding(5)
				.scale(yScale);

			svg.select('.y.axis')
				.call(yAxis);

			if (this.series.length > 1) {
				// Show the legend if we have at least two series
				svg.select('.legend')
					.call(legend().scale(colorScale));
			} else {
				// Make sure we clear the legend if have fewer than two series
				svg.select('.legend')
					.selectAll('g')
					.remove();
			}
		}

	},

	watch: {
		'series' : function () {
			this._color = color.scale(_.pluck(this.series, 'name'));

			this.draw();
		},
		'width'  : 'draw',
		'height' : 'draw',
		'labels' : 'draw'
	}

};