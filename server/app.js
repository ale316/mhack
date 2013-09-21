express = require('express.io')
mongoose = require('mongoose')
crypto = require('crypto')
mongoose.connect('mongodb://localhost/tasks')

db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function callback () {
  console.log('success!')
})

app = express().http().io()
// this is the database mongoose.schema
usersSchema = mongoose.Schema({
    fbId: String,
    email: { type : String , lowercase : true},
    name : String,
    feedLists: { type: [{type: mongoose.Schema.ObjectId, ref: 'FeedList'}], default: null },
    suggestedArticles: { type: [{type: mongoose.Schema.ObjectId, ref: 'SuggestedArticles'}] , default: null }
})
User = mongoose.model('User',usersSchema)

// title, author, description
articlesSchema = mongoose.Schema({
	title: String,
	author: String,
	description: String,
	_id: String,
	link: String,
	submitted: Date,
	source: String
})
Article = mongoose.model('Article', articlesSchema)

commentsSchema = mongoose.Schema({
	user: {type: mongoose.Schema.ObjectId, ref: 'User'},
	submitted: Date,
	body: String,
	article: {type: mongoose.Schema.ObjectId, ref: 'Article'},
	feedList: {type: mongoose.Schema.ObjectId, ref: 'FeedList'}
})
Comment = mongoose.model('Comment', commentsSchema)

upvoteSchema = mongoose.Schema({
	user: {type: mongoose.Schema.ObjectId, ref: 'User'},
	article: {type: mongoose.Schema.ObjectId, ref: 'Article'},
	feedList: {type: mongoose.Schema.ObjectId, ref: 'FeedList'}
})
Upvote = mongoose.model('Upvote', upvoteSchema)

suggestedArticlesSchema = mongoose.Schema({
	user: {type: mongoose.Schema.ObjectId, ref: 'User'},
	articles: [{type: mongoose.Schema.ObjectId, ref: 'Article'}]
})
SuggestedArticles = mongoose.model('SuggestedArticles', suggestedArticlesSchema)

feedSchema = mongoose.Schema({
	_id: String,
	name: String,
	link: String,
	articles: [{type: mongoose.Schema.ObjectId, ref: 'Article'}]
})
Feed = mongoose.model('Feed', feedSchema)

feedListSchema = mongoose.Schema({
	_id: String,
	user: {type: mongoose.Schema.ObjectId, ref: 'User'},
	feeds: [{type: mongoose.Schema.ObjectId, ref: 'Feed'}]
})
FeedList = mongoose.model('FeedList', feedListSchema)

tasksSchema = mongoose.Schema({
	action: String,
	due: String,
	submitted: Date,
	user: String
})

Task = mongoose.model('Task', tasksSchema)


/************ ROUTING *************/
function emitError(req, err) {
	req.io.emit('error', {
		description: err.name+': '+err.message
	})
}

app.io.route('user_log', function(req) {
	// we could abstract this, but is it worth the time?
	console.log(req.data) // logging the incoming data
	userinfo = req.data
	Article.findOne({ fbId: userinfo.fbId }, function(err, user) {
		if(err) emitError(req, err)
		else if(!user) {
			// create the model instance
			user = new User({
				fbId: userinfo.fbId,
				email: userinfo.email,
				name: userinfo.name
			})
			// try inserting it in the database
			user.save(function(err,user) {
				if(err) {
					emitError(req, err)
					return
				}
			})
		}
		req.io.emit('user_logged', user)
	})	
})

app.io.route('article_add', function(req) {
	// we could abstract this, but is it worth the time?
	console.log(req.data) // logging the incoming data
	articleinfo = req.data
	articleinfo.id = crypto.createHash('md5').update(articleinfo.title+articleinfo.source).digest("hex")
	Article.findOne({ fbId: article.id }, function(err, article) {
		if(err) emitError(req, err)
		else if(!user) {
			// create the model instance
			article = new Article({
				id: articleinfo.id,
				title: articleinfo.title,
				author: articleinfo.author,
				description: articleinfo.description,
				link: articleinfo.link,
				submitted: articleinfo.submitted
			})
			// try inserting it in the database
			article.save(function(err,article) {
				if(err) {
					emitError(req, err)
					return
				}
			})
		}
		req.io.emit('article_added', article)
	})	
})

app.io.route('comment_add', function(req) {
	// we could abstract this, but is it worth the time?
	console.log(req.data) // logging the incoming data
	commentinfo = req.data
	comment = new Comment({
		user: commentinfo.user_id,
		submitted: commentinfo.submitted,
		body: commentinfo.body,
		article: commentinfo.article_id,
		feedList: commentinfo.feedList_id
	})
	// try inserting it in the database
	comment.save(function(err,user) {
		if(err) {
			emitError(req, err)
			return
		}
	})
	req.io.emit('comment_added', comment)
})

app.io.route('upvote_add', function(req) {
	// we could abstract this, but is it worth the time?
	console.log(req.data) // logging the incoming data
	upvoteinfo = req.data
	upvote = new Upvote({
		user: upvoteinfo.user_id,
		article: upvoteinfo.article_id,
		feedList: upvoteinfo.feedList_id
	})
	// try inserting it in the database
	upvote.save(function(err,user) {
		if(err) {
			emitError(req, err)
			return
		}
	})
	req.io.emit('upvote_added', comment)
})

app.io.route('load_tasks_by_user', function(res) {
	var user = res.data
	Task.find({ 'user': user }).sort({ due: -1 }).execFind(function(err, tasks) {
		if (err) console.log('error: couldn\'t find tasks for "'+user+'"')// TODO handle the error
		else {
			res.io.emit('loaded_tasks', tasks)
		}
	})
});

app.listen(7076)