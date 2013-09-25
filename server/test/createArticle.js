var mongoose = require('mongoose');
var Article = require('../models/articles');
var should = require('should');
var crypto = require('crypto');


describe("Articles", function() {
	var currentArticle = null;

	beforeEach(function(done) {
		Article.insertOrUpdate({
			title: 'Ponies of the past',
			author: 'John Wayne',
			description: 'An in depth picture of the evolution of ponies and their sexual relevance during the 1900\'s.',
			link: 'http://ponyfags.com/only-the-ponies/',
			source: 'http://ponyfags.com'	
		}, function(err, article) {
			currentArticle = article;
			done();
		});
	});

	afterEach(function(done) {
		Article.model.remove({}, function() {
			done();
		});
	});

	it("insert a new article with null submission date", function(done) {
		Article.insertOrUpdate({
			title: 'Ponies of the future',
			author: 'John Wayne Jr.',
			description: 'An in depth picture of the potential of ponies in contemporary fagotry.',
			link: 'http://ponyfags.com/only-tomorrow-ponies/',
			source: 'http://ponyfags.com'	
		}, function(err, article) {
			should.not.exist(err);
			var hash = crypto.createHash('md5').update('Ponies of the futurehttp://ponyfags.com').digest("hex");
			article.hash.should.equal(hash);
			should.not.exist(article.submitted);
			done();
		});
	});

});