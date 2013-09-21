express = require('express.io')
mongoose = require('mongoose')
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
    feedLists: [{type: mongoose.Schema.ObjectId, ref: 'FeedList'}],
    suggestedArticles: [{type: mongoose.Schema.ObjectId, ref: 'SuggestedArticles'}]
})
User = mongoose.model('User',usersSchema)

// title, author, description
articlesSchema = mongoose.Schema({
	title: String,
	author: String,
	description: String,
	id: String,
	link: String,
	submitted: Date
})
Article = mongoose.model('Article', articlesSchema)

commentsSchema = mongoose.Schema({
	user: {type: mongoose.Schema.ObjectId, ref: 'User'},
	submitted: Date,
	body: String,
	article: {type: mongoose.Schema.ObjectId, ref: 'Article'}
})
Comment = mongoose.model('Comment', commentsSchema)

upvoteSchema = mongoose.Schema({
	user: {type: mongoose.Schema.ObjectId, ref: 'User'},
	article: {type: mongoose.Schema.ObjectId, ref: 'Article'}
})
Upvote = mongoose.model('Upvote', upvoteSchema)

suggestedArticlesSchema = mongoose.Schema({
	user: {type: mongoose.Schema.ObjectId, ref: 'User'},
	articles: [{type: mongoose.Schema.ObjectId, ref: 'Article'}]
})
SuggestedArticles = mongoose.model('SuggestedArticles', suggestedArticlesSchema)

feedSchema = mongoose.Schema({
	id: String,
	name: String,
	link: String,
	articles: [{type: mongoose.Schema.ObjectId, ref: 'Article'}]
})
Feed = mongoose.model('Feed', feedSchema)

feedListSchema = mongoose.Schema({
	id: String,
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

// Broadcast all draw clicks.
app.io.route('task_submitted', function(res) {
	console.log(res.data)
	task = res.data;
	db_task = new Task({ 
		action: task.action,
		due: task.due,
		submitted: new Date(),
		user: task.user
	})
	db_task.save(function (err, task) {
	  if (err) console.log('error: couldn\'t save "'+task.action+'"')// TODO handle the error
	  else {
	  	res.io.emit('task_created', task)	
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