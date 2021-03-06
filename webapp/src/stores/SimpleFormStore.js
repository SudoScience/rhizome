'use strict';

var Reflux = require('reflux');
var api = require('data/api');
var _      = require('lodash');

var SimpleFormActions = require('actions/SimpleFormActions');

var SimpleFormStore = Reflux.createStore({
  data: {
    objectId: null,
    dataObject: null,
    componentData: {},
    formData: {},
    loading: true,
    saving: false
  },

  listenables: [ SimpleFormActions ],

  getInitialState: function(){
    return this.data;
  },

  onBaseFormSave: function(object_id,content_type,data_to_post){
    var self = this;
    var fnLookup = {'indicator': api.post_basic_indicator,'indicator_tag': api.post_indicator_tag}
    var api_fn = fnLookup[content_type];

    var id_to_post = object_id || -1;

    data_to_post['id'] = id_to_post

    Promise.all([
        api_fn(data_to_post),
      ])
        .then(_.spread(function(apiResponse) {

          self.data.formData = apiResponse.meta.form_data;

          self.data.objectId = apiResponse.objects[0].id;
          self.data.dataObject = apiResponse.objects[0];

          self.data.loading = false;
          self.trigger(self.data);
        }));
  },

  onInitialize: function(object_id,content_type) {
    var self = this;
    if (!object_id) {
        var object_id = -1
      }

    self.data.objectId = object_id;

    var fnLookup = {'indicator': api.get_basic_indicator,'indicator_tag': api.get_indicator_tag}
    var api_fn = fnLookup[content_type];

    Promise.all([
          api_fn({ id: self.data.objectId }, null, { 'cache-control': 'no-cache' }),
        ])
          .then(_.spread(function(apiResponse) {

            self.data.formData = apiResponse.meta.form_data;

            self.data.dataObject = apiResponse.objects[0];
            self.data.loading = false;
            self.trigger(self.data);
          }));
    },

  onAddIndicatorCalc: function(data){
      console.log('onAddIndicatorCalc ( from the simpleform store )')
      // var self = this;
      // api.set_indicator_to_tag( {indicator_id:this.$parent.$data.indicator_id, indicator_tag_id:data }).then(function(){
      //   self.loadIndicatorTag();
      // });

      SimpleFormActions.initIndicatorToCalc(indicator_id)

  },

  onAddTagToIndicator: function(indicator_id, tag_id){
    var self = this;

    api.set_indicator_to_tag( {indicator_id:indicator_id, indicator_tag_id:tag_id }).then(function(response){
      return
    });

    SimpleFormActions.initIndicatorToTag(indicator_id)

  },
  deleteTagFromIndicator: function(data){
    console.log(deleteTagFromIndicator)
    // var self = this;
    // api.set_indicator_to_tag( {indicator_id:this.$parent.$data.indicator_id, indicator_tag_id:data,id:'' }).then(function(){
    //   self.loadIndicatorTag();
    // });
  },


  onInitIndicatorToCalc: function(indicator_id) {
    var self = this;

    Promise.all(
      [api.indicator_to_calc({ indicator_id: indicator_id }),
       api.indicators({},null,{'cache-control':'no-cache'})]
      )
      .then(_.spread(function(indicator_to_calc,indicators) {
        var allIndicators = indicators.objects

        var indicatorCalcList  = _.map(indicator_to_calc.objects, function(row) {
            return {'id': row.indicator_component_id, 'display': row.calculation + ' - ' + row.indicator_component__short_name}
        });

        self.data.componentData['indicator_calc'] = {'componentRows':indicatorCalcList, 'dropDownData':allIndicators};
        self.data.loading = false;
        self.trigger(self.data);
    }));
  },

  onInitIndicatorToTag: function(indicator_id) {
    var self = this;

    Promise.all(
      [api.indicator_to_tag({ indicator_id: indicator_id },null,{'cache-control':'no-cache'}),
       api.tagTree({},null,{'cache-control':'no-cache'})] // cache_control
      )
      .then(_.spread(function(indicator_to_tag,tag_tree) {
        var allTags = tag_tree.objects
        var indicatorTags = _.map(indicator_to_tag.objects, function(row) {
            return {'id': row.id, 'display': row.indicator_tag__tag_name}
        })

        self.data.componentData['indicator_tag'] = {'componentRows':indicatorTags, 'dropDownData':allTags};
        self.data.loading = false;
        self.trigger(self.data);

      }));
    },

});

module.exports = SimpleFormStore;
