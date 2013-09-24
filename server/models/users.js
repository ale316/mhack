var Users = function() {
	var mongoose = require('mongoose');
	var Schema   = require('mongoose').Schema;

	var usersSchema = mongoose.Schema({
		fbId              : Number,
		email             : { type : String , lowercase : true},
		first             : String,
		last              : String,
		feedLists         : { type: [{type: Schema.Types.ObjectId, ref: 'FeedList'}], default: null },
		suggestedArticles : { type: [{type: Schema.Types.ObjectId, ref: 'SuggestedArticles'}], default: null },
		friends           : { type: [{type: Schema.Types.ObjectId, ref: 'Users'}], default: null },
		pic               : String
	});

	var _model = mongoose.model('User',usersSchema);

	var _loginOrCreate = function(data, success, fail) {
		_model.update({ 'fbId': data.fbId }, data, { 'upsert': true }, function(err, numRow, raw) {
			if(err) fail(err);
			else {
				_model.findOne({ 'fbId': data.fbId }, function(err,user) {
					if(err) fail(err);
					else success(user);
				});
			}
		});
	};

	return {
		'schema': usersSchema,
		'model': _model,
		'loginOrCreate': _loginOrCreate
	};
}();

module.exports = exports = Users;