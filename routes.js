const util   = require('util');
const crypto = require('crypto');

var ObjectId = require('mongodb').ObjectID;

var tools = require('./tools');

module.exports = function(app, db) {

	var bodyParser = require('body-parser');
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
	   extended: true
	}));

	upload = require('express-fileupload');
	app.use(upload());

	app.get('/', function(req,res){
		(async function() {

			try {
				var hash_obj = await tools.checkHash(req,res);
				
				var events = db.collection("events");

			//	var local_chekins = await chekins.find({location:'odessa'}).toArray();

				var local_events = await events.aggregate([
					{ $lookup:
						{
						from: 'pictures',
						localField: 'picture_id',
						foreignField: '_id',
						as: 'details'
						}
					}
				]).toArray();

				res.render('start',{events:local_events,hash_obj:hash_obj});
			
			} catch(e) {
				console.log('Error '+e);
			}
		})()
	});


	app.get('/claims', function(req,res){
		(async function() {
			try{
				
				var hash_obj = await tools.checkHash(req,res);
				var checkin_claims = db.collection("checkin_claims");

				//var res_claims = await checkin_claims.find({}).toArray();

				var res_claims = await checkin_claims.aggregate([
					{   $lookup:
						{
						from: 'events',
						localField: 'event_id',
						foreignField: '_id',
						as: 'details'
						}
					},
					{
      					$replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$details", 0 ] }, "$$ROOT" ] } }
   					},
  					{ $project: { details: 0 } }
  					,
					{
						$lookup:{
							from:'pictures',
							localField:'picture_id',
							foreignField: '_id',
							as:'pic_details'
						}
					}
				]).toArray();

				console.log(JSON.stringify(res_claims));

				res.render('claims',{hash_obj:hash_obj,claims:res_claims});

			} catch(e) {
				console.log('Error '+e);
				res.end(':(');
			}
		})()
	})

	app.get('/admin2983',function(req,res){
		(async function(){
			try {
				var hash_obj = await tools.checkHash(req,res);

				res.end(util.inspect(hash_obj));


			} catch(e) {
				console.log(e);
			}

		})()
	})

	app.get('/profile',function(req,res){
		(async function(){
			try {
				var hash_obj = await tools.checkHash(req,res);

				var checkins = db.collection("checkins");

				//var user_checkins = await checkins.find({user_id:hash_obj.user_id}).toArray();

				var user_checkins = await checkins.aggregate([
					{ $lookup:
						{
						from: 'events',
						localField: 'event_id',
						foreignField: '_id',
						as: 'details'
						}
					},
					{
      					$replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$details", 0 ] }, "$$ROOT" ] } }
   					},
  					{ $project: { details: 0 } }
  					,
					{
						$lookup:{
							from:'pictures',
							localField:'picture_id',
							foreignField: '_id',
							as:'pic_details'
						}
					}]).toArray();

				console.log('user_checkins '+JSON.stringify(user_checkins));

				res.render('profile',{hash_obj:hash_obj,checkins:user_checkins});
				
			} catch(e) {
				console.log('Profile error '+e);
			}
		})()
	})

	app.get('/upload_picture',function(req,res){
		(async function() {
			try {
				var hash_obj = await tools.checkHash(req,res);

				res.render('upload_picture',{hash_obj:hash_obj});


			} catch(e) {
				console.log(e);
			}
		})()
	})

	app.post('/post_picture',function(req,res){
		(async function() {
			try {

				console.log('req.files '+util.inspect(req.files));
				//var hash_obj = await tools.checkHash(req,res);

				//https://www.npmjs.com/package/express-fileupload
				//https://stackoverflow.com/questions/48715015/uploading-files-using-node-js

				if(req.files){
					
					var hash = crypto.randomBytes(20).toString('hex');

					var filename = req.files.picture.name;

					dot_index = filename.lastIndexOf('.');
    				var extension = filename.slice(dot_index + 1);

					await req.files.picture.mv('public/pics/'+hash+'.'+extension);

					res.end(req.files.picture.name);
				} else {
					res.end('no file');
				}
			
			} catch(e) {
				console.log(e);
			}
		})()
	})



	app.get('/registration',function(req,res){
		(async function() {
			try {
				var hash_obj = await tools.checkHash(req,res);

				res.render('registration',{hash_obj:hash_obj});
			} catch(e) {
				console.log(e);
			}
		})()

	
	})

	app.get('/login',function(req,res){
		(async function() {
			try {
				var hash_obj = await tools.checkHash(req,res);

				res.render('login',{hash_obj:hash_obj});
			} catch(e) {
				console.log(e);
			}
		})()
	})

	app.get('/add_event',function(req,res){
		(async function() {
			try {
				var hash_obj = await tools.checkHash(req,res);

				res.render('add_event_form',{hash_obj:hash_obj});
			} catch(e) {
				console.log(e);
			}
		})()
	})


	return app

}