var Users = function() {
	var mongoose = require('mongoose');
	var Schema   = require('mongoose').Schema;

	var usersSchema = mongoose.Schema({
		fbId              : Number,
		email             : { type : String , lowercase : true},
		first             : String,
		last              : String,
		feedLists         : { type: [{type: String, ref: 'FeedList'}], default: null },
		suggestedArticles : { type: [{type: String, ref: 'SuggestedArticles'}], default: null },
		friends           : { type: [{type: Number, ref: 'User'}], default: null },
		pic               : String
	});

	var _model = mongoose.model('User',usersSchema);

	var _loginOrCreate = function(data, completed) {
		_model.update({ 'fbId': data.fbId }, data, { 'upsert': true }, function(err, numRow, raw) {
			if(err) completed(err);
			else {
				_model.findOne({ 'fbId': data.fbId }, function(err,user) {
					if(err) completed(err);
					else {
						// TODO - if the friends (fbId) array passed corresponds to any known users in the db
						//			we need to add them to the friends list, and update those users's friend lists
						//			to contain the current user's fbId.
						completed(null,user);
					}
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