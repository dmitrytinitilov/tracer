const util   = require('util');
const crypto = require('crypto');

var ObjectId = require('mongodb').ObjectID;

var tools = require('./tools');

module.exports = function(app, db) {


	app.get('/api/checkin_claim',function(req,res){
		(async function(){
			try{
				var hash_obj = await tools.checkHash(req,res);
				var event_id = req.query.event_id;

				var checkin_claims = db.collection("checkin_claims");
				var events         = db.collection("events");

				if (hash_obj.user_id!=0) {

					var result = await events.findOne({_id:ObjectId(event_id)});
					
					if (result._id) {
						checkin_claims.insert({event_id:ObjectId(event_id),user_id:hash_obj.user_id,owner_id:result.owner_id});
					}
				}
				
				res.end('{result:true,error:""}');
				//res.redirect('/');

			} catch(e) {
				console.log(e);
				res.end('{result:false,error:"Chekin error"}');
			}

		})()
	})



	app.get('/api/checkin_confirmation',function(req,res){
		(async function(){
			try {
				var event_id = req.query.event_id;
				var user_id = req.query.user_id;

				var checkins = db.collection("checkins");

				checkins.insert({event_id:ObjectId(event_id),user_id:user_id});

				//res.redirect('/');
				res.end('chekin confirmed');


			} catch(e){
				console.log('Checkin error '+e);
			}
		})()
	})

	app.post('/api/create_event',function(req,res){
		(async function(){
			try {
				var name = req.body.name;
				var description = req.body.description;

				var pictures = db.collection("pictures");
				var events = db.collection("events");
				

				var picture_id=0;

				if(req.files){			
					var hash = crypto.randomBytes(20).toString('hex');

					var filename = req.files.picture.name;

					dot_index = filename.lastIndexOf('.');
    				var extension = filename.slice(dot_index + 1);

    				var inserted_data = await pictures.insert({name:hash+'.'+extension,ref_to:0,type:'original'});
    				var picture_id= inserted_data.ops[0]._id;
    				console.log('result of insert picture'+util.inspect(inserted_data));

					await req.files.picture.mv('public/pics/'+hash+'.'+extension);
				}

				await events.insert({name:name,description:description,picture_id:picture_id});

				res.redirect('/');
			} catch(e){
				console.log(e);
			}
		})()
	})


	app.post('/api/register',function(req,res){
		(async function() {

			try {

				var invite = req.body.invite;
				var login  = req.body.login;
				var password = req.body.password;

				var loginpass = db.collection("loginpass");

				if (login && password) {
					const crypto_password = crypto.createHmac('sha256', password)
	                   .update(login)
	                   .digest('hex');

					await loginpass.insert({login:login,password:crypto_password})
					res.end('added');
				} else {
					res.end('Sorry. There is no data');
				}

			} catch(e) {
				console.log(e);
				res.end('error');
			}

		})()
	})

	app.post('/api/login',function(req,res){
		(async function() {

			try {
				var login  = req.body.login;
				var password = req.body.password;

				var loginpass = db.collection("loginpass");

				var logged_flag = false;

				if (login && password) {
					const crypto_password = crypto.createHmac('sha256', password)
	                   .update(login)
	                   .digest('hex');

	                var user;
	                if (user = await loginpass.findOne({login:login,password:crypto_password}) ) {

	                	logged_flag = true;

	                	//console.log(util.inspect(user));

	                	var user_id = (user._id).toString();

	                	console.log('user_id: '+user_id);

	                	var hash_obj = await tools.checkHash(req,res);
						console.log('hash_obj: '+util.inspect(hash_obj)); 
						var hash_id = hash_obj.hash_id;

						var hashes = db.collection("hashes");

						var result = await hashes.update(
						    { _id: ObjectId(hash_id) },
						    {
						    	$set: {
						    		user_id:user_id,
						    		login:login
						    	}
						    },
						    { upsert: false, multi: true }
						)

						console.log('Update for result '+result);
	                }
	            }

	            if (logged_flag) {
	            	res.redirect('/');
	            } else {
	            	res.redirect('/?msg=rejected');
	            }

			} catch(e){
				console.log(e);
				res.end('error');
			}
		})()
	})

	return app

}