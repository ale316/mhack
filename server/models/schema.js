var mongoose = require('mongoose');
// comments
commentsSchema = mongoose.Schema({
	user: {type: String, ref: 'User'},
	_id: { type: String, required: true },
	submitted: Date,
	body: String,
	article: {type: String, ref: 'Article'},
	feedList: {type: String, ref: 'FeedList'}
})
Comment = mongoose.model('Comment', commentsSchema)

upvoteSchema = mongoose.Schema({
	_id: { type: String, required: true },
	user: {type: String, ref: 'User'},
	article: {type: String, ref: 'Article'},
	feedList: {type: String, ref: 'FeedList'}
})
Upvote = mongoose.model('Upvote', upvoteSchema)

suggestedArticlesSchema = mongoose.Schema({
	_id: { type: String, required: true },
	receiver: {type: String, ref: 'User'},
	sender: {type: String, ref: 'User'},
	article: {type: String, ref: 'Article'}
})
SuggestedArticles = mongoose.model('SuggestedArticle', suggestedArticlesSchema)

feedSchema = mongoose.Schema({
	_id: { type: String, required: true },
	name: String,
	link: String,
	articles: [{type: String, ref: 'Article'}]
})
Feed = mongoose.model('Feed', feedSchema)

feedListSchema = mongoose.Schema({
	_id: { type: String, required: true },
	user: {type: String, ref: 'User'},
	feeds: [{type: String, ref: 'Feed'}]
})
FeedList = mongoose.model('FeedList', feedListSchema)
