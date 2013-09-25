var Articles = function() {
	var mongoose = require('mongoose');
	var Schema   = require('mongoose').Schema;
	var crypto   = require('crypto');

	var articlesSchema = mongoose.Schema({
		hash        : { type: String, required: true },
		title       : String,
		author      : { type: String, default: null },
		description : String,
		link        : String,
		submitted   : { type: Date, default: null },
		source      : String
	});

	var _model = mongoose.model('Article', articlesSchema);

	var _insertOrUpdate = function(data, completed) {
		var hash = crypto.createHash('md5').update(data.title+data.source).digest("hex");

		_model.update({ 'hash': hash }, data, { 'upsert': true }, function(err, numRow, raw) { 
			if(err) completed(err);
			else {
				_model.findOne({ 'hash': hash }, function(err,article) {
					if(err) completed(err);
					else {
						completed(null, article);
					}
				});
			}	
		});	
	};

	return {
		'schema'         : articlesSchema,
		'model'          : _model,
		'insertOrUpdate' : _insertOrUpdate
	};
}();	

module.exports = exports = Articles;