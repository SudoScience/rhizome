"use strict";

var _                 = require('lodash');
var moment            = require('moment');
var React             = require('react');
var Reflux            = require('reflux');
var NavigationStore   = require('../../stores/NavigationStore');
var PermissionStore   = require('../../stores/PermissionStore');
var DashboardStore    = require('../../stores/DashboardStore');
var LandingPageCharts = require('./landingPageCharts');
var LandingPageMaps   = require('./landingPageMaps');
var LandingPageAbout  = require('./landingPageAbout');
var LandingPageRecent = require('./landingPageRecent');

var LandingPage = React.createClass({
  componentWillMount: function() {
    // Promise.all([
    //   api.geo({ parent_location__in : 4 }),
    // ])
    // .then(function(resopnse){
    //   console.log(response);
    // });
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
          <LandingPageMaps />
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