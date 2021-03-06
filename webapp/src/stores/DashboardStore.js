'use strict';

var _ = require('lodash');
var Reflux = require('reflux');
var moment = require('moment');

var RegionStore = require('stores/RegionStore');
var CampaignStore = require('stores/CampaignStore');

var api = require('data/api');
// var builtins = require('dashboard/builtin');

var DashboardStore = Reflux.createStore({
  listenables: [require('actions/DashboardActions')],

  init: function() {
    this.loaded = false;
    this.indicators = {};
    Promise.all([
        RegionStore.getlocationsPromise(),
        RegionStore.getLocationTypesPromise(),
	    	CampaignStore.getCampaignsPromise(),
    	])
      .then(_.spread((locations, locationsTypes, campaigns)=> {
        this.locations = locations;
        this.campaigns = campaigns;

        var locationIdx = _.indexBy(locations, 'id');
        var types = _.indexBy(locationsTypes, 'id');

        _.each(this.locations, function(r) {
          r.location_type = _.get(types[r.location_type_id], 'name');
          r.parent = locationIdx[r.parent_location_id];
        });

        this.loaded = true;

        this.trigger({
          loaded: this.loaded,
          locations: this.locations,
          campaigns: this.campaign
        });
      }));
  },

  getQueries: function() {
    var indicators = this.indicators;
    var qs = _.groupBy(indicators, function(definition, key) {
      return [
        definition.duration,
        definition.startOf,
        definition.locations
      ].join('-');
    });
    return _.map(qs, function(arr) {
      return _.merge.apply(null, arr.concat(function(a, b) {
        if (_.isArray(a)) {
          return a.concat(b);
        }
      }));
    });
  },

  // action handlers
  onSetDashboard: function(definition) {
    var dashboard = this.dashboard = definition.dashboard;
    this.location = definition.location || this.location;
    this.date = definition.date || this.date;

    if (!this.loaded) {
      return;
    }

    this.indicators = {};
    _.each(dashboard.charts, this.addChartDefinition);

    var locations = this.locations;
    var campaigns = this.campaigns;

    var locationIdx = _.indexBy(locations, 'id');
    var topLevellocations = _(locations)
      .filter(function(r) {
        return !locationIdx.hasOwnProperty(r.parent_location_id);
      })
      .sortBy('name');

    var location = _.find(locations, function(r) {
      return r.name === this.location;
    }.bind(this));

    /**

      Question ???
      - onSetDashboard receives correct location, but after this condition rewrites it to Nigeria

    **/
    // if (_.isFinite(dashboard.default_office_id) && _.get(location, 'office_id') !== dashboard.default_office_id) {
    //   location = topLevellocations.find(function(r) {
    //     return r.office_id === dashboard.default_office_id;
    //   });
    // }

    if (!location) {
      location = topLevellocations.first();
    }
    // console.log("4:", this.location, location);

    var campaign = _(campaigns)
      .filter(function(c) {
        return c.office_id === location.office_id &&
          (!this.date || _.startsWith(c.start_date, this.date));
      }.bind(this))
      .sortBy('start_date')
      .last();

    var hasMap = _(dashboard.charts)
      .pluck('type')
      .any(t => _.endsWith(t, 'Map'));


    // console.log("AFTER:", location);
    this.trigger({
      dashboard: this.dashboard,
      location: location,
      campaign: campaign,
      loaded: true,

      locations: locations,
      campaigns: _.filter(campaigns, function(c) {
        return c.office_id === location.office_id;
      }),
      hasMap: hasMap,
    });
  },

  onSetlocation: function(id) {
    var location = _.find(this.locations, function(r) {
      return r.id === id;
    }.bind(this));

    if (location) {
      this.trigger({
        location: location
      });
    }
  },

  // helpers
  addChartDefinition: function(chart) {
    var base = _.omit(chart, 'indicators', 'title');

    _.each(chart.indicators, function(id) {
      var duration = !_.isNull(_.get(chart, 'timeRange', null)) ? moment.duration(chart.timeRange) : Infinity;
      var hash = [id, chart.startOf, chart.locations].join('-');

      if (!this.indicators.hasOwnProperty(hash) || duration > this.indicators[hash].duration) {
        this.indicators[hash] = _.defaults({
          duration: duration,
          indicators: [id]
        }, base);
      }
    }.bind(this));
  }
});

module.exports = DashboardStore;
