// var app = require('http').createServer(handler);
// var io = require('socket.io')(app);
var fs = require('fs');
var http = require('http')

//var config = require('./config');
var mongoose = require('mongoose');


function showErr (e) {
    console.error(e, e.stack);
}

function handler (req, res) {
    res.writeHead(200);
    res.end("");
}

mongoose.connect('mongodb://woUser:webobservatory@localhost/pm25_china');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
    console.log("connected to database");
});


var pmDoc = new mongoose.Schema({
  source: String,
  pm_reading: String,
});



var Message = mongoose.model('shenzhen', pmDoc); 



function harvestNewData(){
	jsonObj = null;

	var options = {
	  host: 'pm25.in',
	  port: 80,
	  path: '/api/querys/aqi_details.json?city=shenzhen&token=5j1znBVAsnSf5xQyNQyq',
	  method : 'GET'
	};

	http.get(options, function(res) {
	console.log("Harvest timestamp ",getDateTime())
	  console.log("Told to harvest new data, and got response: " + res.statusCode);
	  var body = "";
	  res.on("data", function(chunk) {
		//console.log("BODY: " + chunk);
		body += chunk

	  });

	 	res.on('end',function(){
	        var obj = JSON.parse(body);

	        	try{
		        	if(saveDatatoFile(obj)){
		        		console.log("saved object")
		        	}
		        	
		        	}catch(e){
		        		console.log(e);
		        }
	        	
	        

	    })

	}).on('error', function(e) {
	  console.log("Got error: " + e.message);
	});

}

function saveDatatoFile(obj){

		//first lets get the time of one of the objs
		timestamp = "";
		try{
			timestamp = obj[0].time_point;
		}catch(e){
			timestamp = getDateTime();
		}

		var toSave = {"timestamp": timestamp, "location": "Shenzhen, China", "pm_reading": obj};



		fs.appendFile('pm25_china_shenzhen.json', JSON.stringify(toSave)+",\n", function (err) {
		});

		//also add to database
		try{
			saveData(toSave);
		}catch(e){

		}

	}



function saveData(obj){

    try{
        
        //console.log("Data: "+data);

  		var doc = new Message({
				source: "pm25API",
  				pm_reading: obj,
            });

                doc.save(function(err, doc) {
                if (err) return console.error(err);
                //console.dir(thor);
                });



                // console.log("-----")
                // console.log(data_rec.statuses[status].text)
                // console.log(data_rec.statuses[status].created_at)
                // console.log("-----")
            
            
            //console.log("Added New Items: "+data);
			//emit to real-time
			return true;
        }catch(e){

        }

}







//some misc fuinctions

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;

}


var interval = setInterval(function(){harvestNewData()}, 3600000);
