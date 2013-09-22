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
    suggestedArticles: { type: [{type: mongoose.Schema.ObjectId, ref: 'SuggestedArticles'}] , default: null },
    friends : [{type: mongoose.Schema.ObjectId}],
    pic : String
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
	receiver: {type: mongoose.Schema.ObjectId, ref: 'User'},
	sender: {type: mongoose.Schema.ObjectId, ref: 'User'},
	article: {type: mongoose.Schema.ObjectId, ref: 'Article'}
})
SuggestedArticles = mongoose.model('SuggestedArticle', suggestedArticlesSchema)

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
	// ^^nope
	console.log(req) // logging the incoming data
	userinfo = req.data
	var data = req
	User.findOne({ fbId: data.id }, function(err, user) {
		if(err) emitError(req, err);
		else if(!user) {
			// create the model instance
			user = new User({
				fbId: data.id,
				// email: userinfo.email,
				name: data.name,
				pic: data.picture
			})

			addFriends(user,data.friends);

			// try inserting it in the database
			user.save(function(err,user) {
				if(err) {
					emitError(req, err)
					return
				}
			})
		}
		else if (user){

			addFriends(user,data.friends);
		}
		req.io.emit('user_logged', user)
	})	
})

function addFriends(user, friends){
	User.find({'fbId' : { $in: friends}}).all(function(u){
				user.friends.push(u.fbId)
				u.friends.push(user.fbId)
			})
}

app.io.route('article_add', function(req) {
	// we could abstract this, but is it worth the time?
	console.log(req.data) // logging the incoming data
	articleinfo = req.data
	articleinfo.id = crypto.createHash('md5').update(articleinfo.title+articleinfo.source).digest("hex")
	Article.findOne({ _id: articleinfo.id }, function(err, article) {
		if(err) emitError(req, err)
		else if(!article) {
			// create the model instance
			article = new Article({
				_id: articleinfo.id,
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
	upvote.save(function(err,upvote) {
		if(err) {
			emitError(req, err)
			return
		}
	})
	req.io.emit('upvote_added', comment)
})

app.io.route('article_suggest', function(req) {
	console.log(req.data)
	suggested_articleinfo = req.data
	suggested_article = new SuggestedArticle({
		receiver: suggested_articleinfo.receiver_id,
		sender: suggested_article.sender_id,
		article: suggested_articleinfo.article_id
	})
	suggested_article.save(function(err,suggested_article) {
		if(err) {
			emitError(req, err)
			return
		}
	})
	req.io.emit('article_suggested', suggested_article)
})

function createArticle(articleinfo) {
	articleinfo.id = crypto.createHash('md5').update(articleinfo.title+articleinfo.source).digest("hex")
	Article.findOne({ _id: articleinfo.id }, function(err, article) {
		if(err) emitError(req, err)
		else if(!article) {
			// create the model instance
			article = new Article({
				_id: articleinfo.id,
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
		return article
	})
}

function createFeed(feedinfo) {
	articles = feedinfo.articles
	articles_ids = []
	for (var i = 0; i < articles.length; i++) {
		article_ids.push(createArticle(articles[i])._id)
	}
	feedinfo.id = crypto.createHash('md5').update(feedinfo.name+feedinfo.link).digest("hex")
	Feed.findOne({ _id: feedinfo.id }, function(err, feed) {
		if(err) emitError(req, err)
		else if(!feed) {
			feed = new Feed({
				_id: crypto.createHash('md5').update(feedinfo.name+feedinfo.link).digest("hex"),
				name: feedinfo.name,
				link: feedinfo.link,
				articles: article_ids
			})
			feed.save(function(err,feed) {
				if(err) {
					emitError(req, err)
					return
				}
			})
		}
		return feed
	})
}

app.io.route('feed_add', function(req) {
	console.log(req.data)
	feedinfo = req.data
	feed = createFeed(feedinfo)
	req.io.emit('feed_added', feed)
})

app.io.route('feed_list_add', function(req) {
	console.log(req.data)
	feed_listinfo = req.data
	feed_listinfo.id = crypto.createHash('md5').update(feed_listinfo.name+feed_listinfo.user).digest("hex")
	FeedList.findOne({ _id: feed_listinfo.id }, function(err, feed_list) {
		if(err) emitError(req, err)
		else if(!feed_list) {
			feed_list = createFeed(feed_listinfo)
		}
	})
	req.io.emit('feed_added', feed)
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