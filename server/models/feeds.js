var Feeds = function() {
	var mongoose = require('mongoose');
	var Schema   = require('mongoose').Schema;
	var crypto   = require('crypto');
	var async    = require('async');
	var Article  = require('./articles');
	var _        = require('underscore');

	var feedsSchema = mongoose.Schema({
		hash     : { type: String, required: true },
		name     : String,
		url      : String,
		articles : { type: [{type: String, ref: 'Article'}], default: null },
	});

	var _model = mongoose.model('Feed', feedsSchema);

	var _insertOrUpdate = function(data, completed) {

		var hash = crypto.createHash('md5').update(data.name+data.url).digest("hex");
		async.waterfall([
				function(callback) {
					async.map(data.articles, Article.insertOrUpdate, function(err, articles) {
						if(err) {
							callback(err);
						} else {
							var articles_hashes = _.map(articles, function (a) { return a.hash; });
							callback(null,articles_hashes);
						}
					});
				},
				function(articles_hashes, callback) {
					data.articles = articles_hashes;
					_model.update({ 'hash': hash }, data, { 'upsert': true }, function(err, numRow, raw) { 
						if(err) callback(err);
						else {
							_model.findOne({ 'hash': hash }, function(err,feed) {
								if(err) callback(err);
								else {
									callback(null,feed);
								}
							});
						}	
					});
				}
			], function(err, results) {
				completed(null, results);
			});
			
	};

	return {
		'schema'         : feedsSchema,
		'model'          : _model,
		'insertOrUpdate' : _insertOrUpdate
	};
}();	

module.exports = exports = Feeds;