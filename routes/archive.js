var fs = require('fs');
var csv = require("fast-csv");
var crypto = require('crypto');
var zip = require('adm-zip');

function randomizeDate(d) {
	var parts = d.split('-');

	var date = new Date();
	date.setFullYear(parts[2]);
	date.setMonth(parts[1]-1);
	date.setDate(parts[0]);

	var delta = Math.random()*4*(parseInt(Math.random()*2)?1:-1);
	var t = date.getTime()-(delta*3600*24*1000);

	date.setTime(t);
	var newDate = ('0'+date.getDate()).slice(-2) + '-' + ('0'+(date.getMonth()+1)).slice(-2) + '-' + date.getFullYear();

	return newDate;
}

function hash(data) {

	console.log('hash algo');
	var shasum = crypto.createHash('sha1');
	shasum.update(data);
	var hash = shasum.digest('base64');
	console.log(hash);

	return hash;
}

function hmac(data, key) {

	console.log('hmac algo');
	var hmac = crypto.createHmac('sha1', key);
	hmac.update(data);
	var hash = hmac.digest('base64');
	console.log(hash);

	return hash;
}

function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function scramble(data, dataType, key) {

	if (dataType == '') {
		return data;

	} else if (dataType == '3') {
		return randomizeDate(data);

	} else {
		if (typeof key === 'undefined') {
			return hash(data);
		} else {
			return hmac(data, key);			
		}
	}	
}

exports.index = function(req, res){

	console.log('archive');
	console.log(req.body);

	// prepare write stream
	var csvStream = csv
	    .createWriteStream({headers: true})
	    .transform(function(cols){

	    	console.log('cols');
	    	console.log(cols);

		 	// for (var i=0; i<cols.length; i++) {
		 	// 	var dataType = req.body['type'+i];
				// cols[i] = scramble(cols[i], dataType);
		 	// }
		 	var i=0;
		 	var newCols = {};
		 	for (key in cols) {
		 		var dataType = req.body['type'+i];
		 		var dataTypeStr = '';
		 		switch (dataType) {
		 			case '0': 
		 				dataTypeStr = 'Scramble';
						newCols[key+'['+ dataTypeStr +']'] = scramble(cols[key], dataType, 'master-seed');
		 				break;
		 			case '1': 
		 				dataTypeStr = 'Shuffle';
						newCols[key+'['+ dataTypeStr +']'] = cols[key];
		 				break;
		 			case '2': 
		 				dataTypeStr = 'Group Shuffle';
						newCols[key+'['+ dataTypeStr +']'] = cols[key];
		 				break;
		 			case '3': 
		 				dataTypeStr = 'Random Offset';
						newCols[key+'['+ dataTypeStr +']'] = scramble(cols[key], dataType);
		 				break;
		 			case '4': 
		 				dataTypeStr = 'Drop';
		 				break;
		 			default: 
						newCols[key] = cols[key];
		 				break;
		 		}
				i++;
		 	}

		 	return newCols;
	    }),
	    writableStream = fs.createWriteStream("/tmp/data_"+new Date().getTime()+".csv");
	 
	writableStream.on("finish", function(){
	  console.log("DONE!");
	});
	 
	csvStream.pipe(writableStream);

	tmp = req.session.tmp;
	console.log(tmp);

	var shuffleArr = {};
	var shuffleGrp = [];
	// 1st pass read stream
	csv.fromPath(tmp, {headers: true}).on("data", function(row){

		var i = 0;
		var grp = {};
		for (key in row) {
			var dataType = req.body['type'+i];
			if (dataType == 1) {
				console.log(shuffleArr[key]);
				if (typeof shuffleArr[key] === 'undefined')
					shuffleArr[key] = [];

				shuffleArr[key].push(row[key]);
			} else if (dataType == 2) {
				grp[key] = row[key];
			}
			i++;
		}
		shuffleGrp.push(grp);

	}).on("end", function(){
		console.log("shuffleArr");
		console.log(shuffleArr);
		console.log("shuffling");
		for (key in shuffleArr) {
			shuffleArr[key] = shuffle(shuffleArr[key]);
		}
		shuffleGrp = shuffle(shuffleGrp);

		console.log(shuffleArr);
		console.log(shuffleGrp);

		// 2nd pass to read stream and write to write stream
		csv.fromPath(tmp, {headers: true}).on("data", function(row){

			var newRow = row;

			for (key in shuffleArr) {
				var val = shuffleArr[key].pop();
				newRow[key] = val;
			}
			var grp = shuffleGrp.pop();
			for (key in grp) {
				newRow[key] = grp[key];
			}
			console.log('newRow');
			console.log(newRow);
			csvStream.write(newRow);

		}).on("end", function(){
			console.log("done");
			csvStream.end();
			res.redirect("/");
		}).on("error", function(err){
			console.log(err.toString());
			console.log(err.stack);
			res.end(err.toString());
		});

	}).on("error", function(err){
		console.log(err.toString());
		console.log(err.stack);
		res.end(err.toString());
	});

};

exports.scramble = function(req, res){

	var colArr = req.body.colArr;
	var dataType = req.body.dataType;
	console.log('scramble');
	console.log(colArr);
	console.log(dataType);

	var data = [];
	if (dataType == '1' || dataType == '2') {
		data = shuffle(colArr);
	} else {

		for (var i=0; i<colArr.length; i++) {
			var scrambled = scramble(colArr[i], dataType);
			data.push(scrambled);
		}
	}
	res.end(JSON.stringify({data: data}));
};

exports.download = function(req, res) {

	var zipper = new zip();
	var files = req.body.files;
	console.log(files);
	if (files instanceof Array) {
	} else {
		files = [files];
	}		
	for (var i=0; i<files.length; i++) {
		var path = '/tmp/' + files[i];
		zipper.addLocalFile(path);
		// zipper.addFile('test', fs.readFileSync(path));
	}

	res.setHeader('Content-disposition', 'attachment; filename=download.zip');
	res.setHeader('Content-type', 'application/zip');

	res.end(zipper.toBuffer());
}

exports.view = function(req, res) {

	var file = req.query.file;
	console.log(file);
	var path = '/tmp/' + file;
	var data = fs.readFileSync(path);
	res.end(data);
}