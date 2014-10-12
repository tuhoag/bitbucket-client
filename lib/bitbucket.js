'use strict'
var request = require('request');
var mustache = require('mustache');
var qs = require('querystring');
var api = require('./api');

var requestTokenUrl = "https://bitbucket.org/api/1.0/oauth/request_token";
var accessTokenUrl = "https://bitbucket.org/api/1.0/oauth/access_token";
var authenticateUrl = "https://bitbucket.org/api/1.0/oauth/authenticate";

var bitbucket = exports;

function Repository(){
	this.scm = '';
	this.hasWiki = '';
	this.description = '';

}

function BitBucket(consumerKey, consumerSecret, callbackUrl){
	this.oauth = {
		requestToken: {},
		accessToken: {},
		callback: callbackUrl,
		consumer: {
			key: consumerKey,
			secret: consumerSecret
		}
	};

	// console.log(this.oauth);
}
BitBucket.prototype.createRepository = function (owner, callback){
	var test = 1;
}

BitBucket.prototype.findRepositories = function (owner, callback){
	var method = api['repo.list'].method;
	var path = this.getUrl('repo.list', {owner:owner});
	
	var options = {
		method: method,
		url: path,
		oauth:{
			consumer_key: this.oauth.consumer.key,
			consumer_secret: this.oauth.consumer.secret,
			token: this.oauth.accessToken.token,
			token_secret: this.oauth.accessToken.secret
		}
	};

	request(options, function(err, res, body){
		var result = body;

		// console.log(JSON.stringify(result));
		callback(result);
	});
}

BitBucket.prototype.getUrl = function (resource, data) {
    var apiPath = api[resource] ? mustache.render(api[resource].path, data) : '';
    return apiPath;
}

BitBucket.prototype.getAuthenticationToken = function(){
	var self = this;

	return function getAuthenticationToken(req, res){

		var oauth = { callback: self.oauth.callback,
    					consumer_key: self.oauth.consumer.key,
    					consumer_secret: self.oauth.consumer.secret};

		request.post({url: requestTokenUrl, oauth: oauth}, function(e, r, body){	
			var token = qs.parse(body);
			// console.log(token);

			self.oauth.requestToken.token = token.oauth_token;
			self.oauth.requestToken.secret = token.oauth_token_secret;
			res.redirect(authenticateUrl + "?oauth_token=" + self.oauth.requestToken.token);
		});
	};
}

BitBucket.prototype.getAccessToken = function(){
	var self = this;

	return function (req, res){
		var oauthVerifier = req.query.oauth_verifier;
		// console.log(oauthVerifier);

		var oauth = {
			consumer_key: self.oauth.consumer.key,
    		consumer_secret: self.oauth.consumer.secret,
    		token: self.oauth.requestToken.token,
    		token_secret: self.oauth.requestToken.secret,
    		verifier: oauthVerifier
		};

		request.post({url: accessTokenUrl, oauth: oauth}, function(e, r, body){
			var token = qs.parse(body);
			// console.log(qs.parse(body));

			self.oauth.accessToken.token = token.oauth_token;
	        self.oauth.accessToken.secret = token.oauth_token_secret;

	        res.send("Access Token: " + JSON.stringify(self.oauth.accessToken));
		});
	};
}

bitbucket.BitBucket = BitBucket;