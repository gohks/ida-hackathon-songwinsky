var fs = require('fs');
var csv = require("fast-csv");

exports.index = function(req, res){

	var csvArray = [];
	var tmp = req.files.upload_file.path;
	console.log(tmp);

	req.session.tmp = tmp;

	csv.fromPath(tmp).on("data", function(row){
		console.log("data");
	 	console.log(row);

		csvArray.push(row);

	}).on("end", function(){
		console.log("done");
		res.render("upload", {csv: csvArray});
	}).on("error", function(err){
		console.log(err.toString());
		console.log(err.stack);
		res.end(err.toString());
	});
};

