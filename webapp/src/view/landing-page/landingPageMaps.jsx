"use strict";

var React = require('react');

var LandingPageMaps = React.createClass({
	render: function() {
		return (
			<h2>Landing Page Maps</h2>
        // <Chart type='ChoroplethMap'
        //     data={missedChildrenMap}
        //     loading={loading}
        //     options={{
        //       domain  : _.constant([0, 0.1]),
        //       value   : _.property('properties[475]'),
        //       yFormat : d3.format('%'),
        //       onClick : d => { DashboardActions.navigate({ location : d }) }
        //     }} />
    );
  }
});


module.exports = LandingPageMaps;