"use strict";

var _                 = require('lodash');
var moment            = require('moment');
var React             = require('react');

var api               = require('data/api.js')
var LandingPageCharts = require('./landingPageCharts');
var LandingPageMaps   = require('./landingPageMaps');
var LandingPageAbout  = require('./landingPageAbout');
var LandingPageRecent = require('./landingPageRecent');

var LandingPage = React.createClass({
  getInitialState: function() {
    return {
      mapData: [{}]
    }
  },
  componentWillMount: function() {
    Promise.all([
      api.geo({ parent_location__in : 4 }),
    ]).then(function(response) {
      console.log(response);
    });

    // Get map data from API and set it here
    // this.setState({mapData: apiResponse});
  },
  render: function() {
    var divStyle = {
      minHeight: '20rem'
    };
    return (
      <div className="row">
        <p className="pageWelcome">
          Welcome to UNICEF&rsquo;s Polio Eradication data portal.
        </p>
        <section className="large-6 medium-6 small-12 columns" style={divStyle}>
          <LandingPageCharts />
        </section>
        <section className="large-6 medium-6 small-12 columns" style={divStyle}>
          <LandingPageMaps data={this.state.mapData} />
        </section>
        <div className="about columns">
          <LandingPageRecent />
          <LandingPageAbout />
        </div>
      </div>
    );
  }
});

module.exports = LandingPage;