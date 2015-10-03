"use strict";

var React = require('react');

var LandingPageRecent = React.createClass({
	render: function() {
		return (
      <div className="about medium-8 columns">
        <h2>Recent Campaigns</h2>
        <table>
          <tbody></tbody>
          <tfoot>
            <tr>
              <td className="more" colSpan="6">
                // <a href="#" onClick={this.showAllCampaigns}>see all campaigns</a>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
		);
	}
});

module.exports = LandingPageRecent;