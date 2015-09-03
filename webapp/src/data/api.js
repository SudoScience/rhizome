/* jshint browser: true */
/* global Promise */
'use strict';

var BASE_URL = '/api';

var _ = require('lodash');
var request = require('superagent');
var prefix = require('superagent-prefix')(BASE_URL);

var treeify = require('../data/transform/treeify');
var campaign = require('../data/model/campaign');

function urlencode(query) {
  return '?' + _.map(query, function (v, k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(v);
    }).join('&');
}

function getCookie(name) {
  var cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
      var cookie = cookies[i];//jQuery.trim(cookies[i]);
      // Does this cookie string begin with the name we want?
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function endPoint(path, mode, defaultVersion, useDefaults) {
  mode = (mode) ? mode.toUpperCase() : 'GET';
  defaultVersion = defaultVersion || 1;
  useDefaults = _.isUndefined(useDefaults) ? true : useDefaults;

  var defaults = {
    format: 'json',
  };


  function fetch(query, version, headers) {
    version = version || defaultVersion;
    headers = headers || {};

    var versionedPath = '/v' + version + path;
    var req = prefix(request(mode, versionedPath));

    // form GET request
    if (mode === 'GET') {
      var q = useDefaults ? _.defaults({}, query, defaults) : query;
      req.query(q)
        .set(headers)
        .send();
    }
    // form POST request
    else if (mode === 'POST') {
      var csrftoken = getCookie('csrftoken');
      req.query(defaults)
        .set('X-CSRFToken', csrftoken)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send(query);
    }

    return new Promise(function (fulfill, reject) {
      req.end(function (error, res) {
        if (error) {
          reject({
            status: res.status,
            msg: res.body.error
          });
        } else {
          fulfill({
            meta: res.body.meta || {},
            objects: _.isArray(res.body) ?
              res.body :
            res.body.objects || _.omit(res.body, 'meta')
          });
        }
      });
    });
  }

  fetch.toString = function (query, version) {
    version = version || defaultVersion;
    var versionedPath = '/v' + version + path;

    return BASE_URL + versionedPath + urlencode(_.defaults({}, query, defaults));
  };

  return fetch;
}

function datapoint(q) {
  var fetch = endPoint('/datapoint/');

  // Return a promise so we can chain the requests for datapoints with the
  // campaign lookups.
  return new Promise(function (fulfill, reject) {

    // Fetch datapoints first, then look up the campaigns. Once campaign data
    // has been filled in, fulfill the promise.

    fetch(q).then(function (data) {
      var campaigns = data.objects.map(function (d) {
        return d.campaign;
      });

      endPoint('/campaign/', 'get', 2)({
        id__in: _.uniq(campaigns)
      }).then(function (campaignData) {
        var campaigns = _.indexBy(campaignData.objects, 'id');

        // Replace the campaign IDs with campaign objects
        for (var i = data.objects.length - 1; i >= 0; --i) {
          data.objects[i].campaign = campaign(campaigns[data.objects[i].campaign]);
        }

        fulfill(data);
      });

    }, reject);

  });
}
datapoint.toString = function (query, version) {
  return endPoint('/datapoint/').toString(query, version);
};

function indicatorsTree(q) {
  var fetch1 = endPoint('/indicator/', 'get', 1);
  var fetch2 = endPoint('/indicator_tag', 'get', 2);
  var makeTagId = function (tId) {
    return 'tag-' + tId;
  };
  return new Promise(function (fulfill, reject) {

    fetch1(q).then(function (indicators) {
      fetch2().then(function (tags) {
        tags.objects = _.sortBy(tags.objects, 'tag_name').reverse();
        var tags_map = {};
        _.each(tags.objects, function (t) {
          tags_map[t.id] = t;
          t.id = makeTagId(t.id);
          t.noValue = true;
          t.parent = t.parent_tag_id && t.parent_tag_id !== 'None' ? makeTagId(t.parent_tag_id) : null;
          t.children = [];
          t.title = t.tag_name;
          t.value = t.id;
        });

        // add 'Other Indicators' tag to collect any indicators without tags
        var otherTag = {
          'id': 0,
          'value': makeTagId(0),
          'noValue': true,
          'title': 'Other Indicators',
          'children': []
        };

        _.each(indicators.objects, function (i) {
          i.title = i.name;
          i.value = i.id;
          if (!_.isArray(i.tag_json) || i.tag_json.length === 0) {
            otherTag.children.push(i);
          }
          else if (_.isArray(i.tag_json)) {
            _.each(i.tag_json, function (tId) {
              tags_map[tId].children.push(i);
            });
          }
        });

        // add other tag?
        if (otherTag.children.length > 0) {
          tags.objects.push(otherTag);
        }
        //tags.objects.reverse();
        // sort indicators with each tag
        _.each(tags.objects, function (t) {
          t.children = _.sortBy(t.children, 'title');
        });

        tags.objects = treeify(tags.objects, 'id');
        tags.objects.reverse();
        tags.flat = indicators.objects;
        fulfill(tags);
      });
    }, reject);
  });
}
function tagTree(q) {
  var fetch = endPoint('/indicator_tag', 'get', 2);
  return new Promise(function (fulfill, reject) {

    fetch().then(function (tags) {
      var tags_map = {};
      _.each(tags.objects, function (t) {
        tags_map[t.id] = t;
        t.parent = t.parent_tag_id
        t.children = [];
        t.title = t.tag_name;
        t.value = t.id;
      });
      tags.objects = treeify(tags.objects, 'id');
      tags.flat = tags.objects;
      fulfill(tags);
    }, reject);
  });
}

module.exports = {
  campaign: endPoint('/campaign/', 'get', 1),
  regions: endPoint('/region/', 'get', 1),
  datapointsRaw: endPoint('/datapointentry/','get', 1),
  indicators: endPoint('/indicator/', 'get', 1),
  office: endPoint('/office/', 'get', 1),
  region_type: endPoint('/region_type/', 'get', 1),
  indicator_to_tag: endPoint('/indicator_to_tag/', 'get', 1),
  indicator_tag: endPoint('/indicator_tag/', 'get', 1),

  // TO MIGRATE //
  get_dashboard: endPoint('/custom_dashboard/', 'get', 2),
  document: endPoint('/document/', 'get', 2),
  document_meta: endPoint('/document/metadata/', 'get', 2),
  geo: endPoint('/geo/'),
  groups: endPoint('/group/', 'get', 2),
  user_groups: endPoint('/user_group/', 'get', 2),
  region_permission: endPoint('/region_permission/', 'get', 2),
  user_permissions: endPoint('/user_permission/', 'get', 2),

  // MOVE THIS TO ETL API //

  document_review: endPoint('/document_review/', 'get', 2),
  get_source_object_map: endPoint('/source_object_map/','get',2,false),
  refresh_master: endPoint('/refresh_master/', 'get', 2, false),


  // POST //
  datapointUpsert: endPoint('/datapointentry/', 'post'),
  save_dashboard: endPoint('/custom_dashboard/', 'post', 2),
  set_region_permission: endPoint('/region_permission/', 'post', 2),
  set_indicator_to_tag: endPoint('/indicator_to_tag/', 'post', 2),
  post_source_object_map: endPoint('/source_object_map/','post',2,false),


  // CUSTOM GET REQUESTS -> MANIPULATED BY JS //
  datapoints: datapoint,
  indicatorsTree: indicatorsTree,
  tagTree: tagTree,


  // THIS NEEDS TO BE GONE //

  admin: {
    usersMetadata: endPoint('/user/metadata/', 'get', 2, false),
    users: endPoint('/user/', 'get', 2, false),
    groupsMetadata: endPoint('/group/metadata/', 'get', 2, false),
    groups: endPoint('/group/', 'get', 2, false),
    regionsMetadata: endPoint('/region/metadata/', 'get', 2, false),
    regions: endPoint('/region/', 'get', 2, false),
    campaignsMetadata: endPoint('/campaign/metadata/', 'get', 2, false),
    campaigns: endPoint('/campaign/', 'get', 2, false),
    indicatorsMetadata: endPoint('/indicator/metadata/', 'get', 2, false),
    indicators: endPoint('/indicator/', 'get', 2, false),

    // raw data //
    submission: endPoint('/source_submission/', 'get', 2, false),
    submissionMeta: endPoint('/source_submission/metadata/', 'get', 2, false),
    // upload //
    docDetail: endPoint('/document_detail/', 'get', 2, false),
    docDetailMeta: endPoint('/document_detail/metadata/', 'get', 2, false),
    // mapping tab //
    docMap: endPoint('/doc_mapping/', 'get', 2, false),
    docMapMeta: endPoint('/doc_mapping/metadata/', 'get', 2, false),
    // validation tab //
    docValidate: endPoint('/doc_datapoint/', 'get', 2, false),
    docValidateMeta: endPoint('/doc_datapoint/metadata/', 'get', 2, false),
    // aggregated and computed results //
    docResults: endPoint('/synced_datapoint/', 'get', 2, false),
    DataPointMetaData: endPoint('/synced_datapoint/metadata/', 'get', 2, false),

  }
};
