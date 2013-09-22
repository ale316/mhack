express = require('express.io')
mongoose = require('mongoose')
crypto = require('crypto')
async = require('async')
_ = require('underscore')
mongoose.connect('mongodb://localhost/tasks')

db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function callback () {
  console.log('success!')
})

app = express().http().io()
// this is the database mongoose.schema
usersSchema = mongoose.Schema({
    _id: { type: String, required: true },
    email: { type : String , lowercase : true},
    name : String,
    feedLists: { type: [{type: String, ref: 'FeedList'}], default: null },
    suggestedArticles: { type: [{type: String, ref: 'SuggestedArticles'}] , default: null },
    friends : [{type: String}],
    pic : String
})
User = mongoose.model('User',usersSchema)

// title, author, description
articlesSchema = mongoose.Schema({
	title: String,
	author: String,
	description: String,
	_id: { type: String, required: true },
	link: String,
	submitted: Date,
	source: String,
	rank: Number 
})
Article = mongoose.model('Article', articlesSchema)

// article list functions
function articleMerge(a,b){
	a = a.sort(articleCompare);
	b = b.sort(articleCompare);
	var c = []
	while(a.length > 0 && b.length > 0){
		// remove elements from a,b building c 
		// in effect a insert sort merge
		while(a[0].rank > b[0].rank){
			if(a[0]._id === b[0]._id){
				// a[0] == b[0], remove duplicates
				a = a.shift();
			}
			c.push(b[0]);
			b = b.shift();
		} while (a[0].rank < b[0].rank){
			if(a[0]._id === b[0]._id){
				// a[0] == b[0], remove duplicates
				b = b.shift();
			}
			c.push(a[0]);
			a = a.shift();
		}
		if (a[0].rank === b[0].rank){
			if(a[0]._id === b[0]._id){
				// a[0] == b[0], remove duplicates
				c.push(a[0]);
				a = a.shift();
				b = b.shift();
			} else {
				c.push(a[0]);
				c.push(b[0]);
				a = a.shift();
				b = b.shift();
			}
		}
	} // master loop
	return c;
}

function articleCompare(a,b) {
  if (a.rank < b.rank)
     return -1;
  if (a.rank > b.rank)
    return 1;
  return 0;
}

// objs.sort(articleCompare);

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
	User.findOne({ fbId: data.id }, function(err, user) {
		if(err) emitError(req, err);
		else if(!user) {
			// create the model instance
			user = new User({
				_id: userinfo.id,
				fbId: userinfo.id,
				// email: userinfo.email,
				name: userinfo.name,
				pic: userinfo.picture
			})

			addFriends(user,userinfo.friends);

			// try inserting it in the database
			user.save(function(err,user) {
				if(err) {
					emitError(req, err)
					return
				}
			})
		}
		else if (user){

			addFriends(user,userinfo.friends);
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
		_id: crypto.createHash('md5').update(commentinfo.user_id+Date.now()).digest("hex"),
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
		_id: crypto.createHash('md5').update(upvoteinfo.user_id+Date.now()).digest("hex"),
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
		_id: crypto.createHash('md5').update(suggested_articleinfo.sender+Date.now()).digest("hex"),
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

function createArticle(articleinfo, callback) {
	console.log(articleinfo)
	articleinfo.id = crypto.createHash('md5').update(articleinfo.title+articleinfo.source).digest("hex")
	console.log(articleinfo)

	Article.findOne({ _id: articleinfo.id }, function(err, article) {
		console.log("err")
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
		console.log("making article")
		callback(null,article)
	})
	console.log('jdbsdb')
}

function createFeed(feedinfo) {
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

function createArticles(feedinfo) {
	articles = feedinfo.articles
	msg = articles ? articles : "no articles"
	articles_ids = []
	/*for (i = 0; i < articles.length; i++) {
		new_article = createArticle(articles[i])
		articles_ids.push(new_article._id)
	}*/
	async.map(articles,createArticle, function (err,  articles) {
		console.log('done!')		
        

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
		if(err) {
			emitError(req, err)
			return
		} else if(!feed_list) {
			feed_ids = []
			for (var i = 0; i < feed_listinfo.feeds.length; i++) {
				feed_ids.push(createFeed(feed_listinfo.feeds[i])._id)
			}
			feed_list = new FeedList({
				_id: feed_listinfo.id,
				name: feed_listinfo.name,
				user: feed_listinfo.user,
				feeds: feed_ids
			}) //createFeed(feed_listinfo)
			feed_list.save(function(err,feed_list) {
				if(err) {
					emitError(req, err)
					return
				}
			})
		} else {
			feed_ids = []
			for (var i = 0; i < feed_listinfo.feeds.length; i++) {
				feed_ids.push(createFeed(feed_listinfo.feeds[i])._id)
			}

		}
		req.io.emit('feed_added', feed_list)
	})
	
})


/*-- GETTERS --*/
// takes the user_id as input
app.io.route('get_feed_lists_by_user', function(req) {
	user_id = req.data
	FeedList.find({ 'user': user_id }, function(err, feed_lists) {
		if(err) emitError(req, err)
		else {
			req.io.emit('feed_lists_by_user', feed_lists)
		}
	})

})

app.io.route('get_articles_by_feed_list', function(req) {
	feed_list_id = req.data
	FeedList.findOne({ _id: feed_list_id }, function(req) {

	})
	Article.find({ 'user': user_id }, function(err, feed_lists) {
		if(err) emitError(req, err)
		else {
			req.io.emit('feed_lists_by_user', feed_lists)
		}
	})

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