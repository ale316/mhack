express = require('express.io')
//routes = require('./routes')
mongoose = require('mongoose') 
mongoose.connect('mongodb://localhost/tasks')

db = mongoose.connection

db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function callback () {
  console.log('success!')
})

app = express().http().io()

// this is the database schema
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