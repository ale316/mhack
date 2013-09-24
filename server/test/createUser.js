var mongoose = require('mongoose');
var User = require('../models/users');
var should = require("should");

mongoose.connect('mongodb://localhost/feeder_test')

describe("Users", function() {
	var currentUser = 0000000;

	beforeEach(function(done) {
		User.loginOrCreate({
			fbId: 0000000,
			email: 'test@test.com',
			first: 'pony',
			last: 'fag',
			pic: 'http://google.com/logo.png'	
		}, function(user) {
			currentUser = user;
			done();
		});
	});

	afterEach(function(done) {
		User.model.remove({}, function() {
			done();
		});
	});

	it("registers a new user", function(done) {
		User.loginOrCreate({
			fbId: 0000001,
			email: 'test2@test.com',
			first: 'pony2',
			last: 'fag2',
			pic: 'http://google.com/logo2.png'	
		}, function(user) {
			user.email.should.equal('test2@test.com');
			done();
		}, function(message) {
			message.should.equal(null);
			done();
		});
	});



});