"use strict";

var _     = require('lodash');
var React = require('react');
var Chart = require('component/Chart.jsx');

var LandingPageMaps = React.createClass({
  propTypes : {
    data     : React.PropTypes.object,
    loading  : React.PropTypes.bool
  },
  getDefaultProps : function () {
    return {
      data    : []
    };
  },
	render: function() {
		return (
      <div>

			<h2>Landing Page Maps</h2>
      <Chart type='ChoroplethMap'
          data={this.props.data}
          loading={false}
          options={{
            domain  : _.constant([0, 0.1]),
            value   : _.property('properties[475]'),
            yFormat : d3.format('%'),
            // onClick : d => { DashboardActions.navigate({ location : d }) }
          }} />
      </div>
    );
  }
});

module.exports = LandingPageMaps;