var mongoose = require('mongoose');
var Feed = require('../models/feeds');
var should = require('should');
var crypto = require('crypto');


describe("Feeds", function() {
	var currentFeed = null;

	beforeEach(function(done) {
		Feed.insertOrUpdate(
		{
			name: 'Pony websites',
			url: 'http://ponyfags.com/feed.rss',
			articles: [/*{
					title: 'Ponies of the past',
					author: 'John Wayne',
					description: 'An in depth picture of the evolution of ponies and their sexual relevance during the 1900\'s.',
					link: 'http://ponyfags.com/only-the-ponies/',
					source: 'http://ponyfags.com'	
				}*/]			
		}
		, function(feed) {
			currentFeed = feed;
			done();
		});
	});

	afterEach(function(done) {
		Feed.model.remove({}, function() {
			done();
		});
	});

	it("insert a new feed with 2 articles", function(done) {
		Feed.insertOrUpdate(
		{
			name: 'Pony websites',
			url: 'http://ponyfags.com/feed.rss',
			articles: [{
					title: 'Ponies of the past',
					author: 'John Wayne',
					description: 'An in depth picture of the evolution of ponies and their sexual relevance during the 1900\'s.',
					link: 'http://ponyfags.com/only-the-ponies/',
					source: 'http://ponyfags.com'	
				}, {
					title: 'Ponies of the future',
					author: 'John Wayne Jr.',
					description: 'An in depth picture of the potential of ponies in contemporary fagotry.',
					link: 'http://ponyfags.com/only-tomorrow-ponies/',
					source: 'http://ponyfags.com'	
				}]			
		}, function(err, feed) {
			should.not.exist(err);
			var hash = crypto.createHash('md5').update('Pony websiteshttp://ponyfags.com/feed.rss').digest("hex");
			feed.hash.should.equal(hash);
			feed.articles.should.have.lengthOf(2);
			done();
		});
	});

});