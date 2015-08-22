var fs = require('fs');

exports.index = function(req, res){

	var csvFiles = [];

	var files = fs.readdirSync('/tmp');

	for (var i=0; i<files.length; i++) {
		var file = files[i];
		// console.log(file);
		if (file.indexOf('data_') == 0)
			csvFiles.push(file);
	}

	console.log(csvFiles);
	res.render('index', { files: csvFiles });


};