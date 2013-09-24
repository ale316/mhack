var Articles = function() {
	var mongoose = require('mongoose');
	var Schema   = require('mongoose').Schema;

	var articlesSchema = mongoose.Schema({
		hash: { type: String, required: true },
		title: String,
		author: { type: String, default: null },
		description: String,
		link: String,
		submitted: { type: Date, default: null },
		source: String,
		rank: { type: Number, default:  } 
	});

	var _model = mongoose.model('Article', articlesSchema);


	return {
		'schema': articlesSchema,
		'model': _model
	};
};	