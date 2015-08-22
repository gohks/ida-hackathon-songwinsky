function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

function hash(el) {
	var colIndex = $(el).attr('colIndex');
	var dataType = $(el).val();
	var oldDataType = $(el).attr('old');
	console.log('colIndex: ' + colIndex);
	console.log('dataType: ' + dataType);
	console.log('oldDataType: ' + oldDataType);

	if (dataType == '4') {
	} else if (dataType == '2' || oldDataType == '2') {

		var grpIndex = [];
		var selectArr = $('select').each(function(index) {

			console.log('val: ' + $(this).val());
			if ($(this).val() === '2') {
				grpIndex.push($(this).attr('colindex'));
			}
		});

		console.log(grpIndex);

		var size = $('td[colindex=0]').length;
		var grpArr = [];
		for (var i=0; i<size; i++) {
			var grp = {};
			for (var j=0; j<grpIndex.length; j++) {
				var index = grpIndex[j];
				var val = $('tr:eq('+(i+2)+') td[colindex='+index+']').attr('data');
				grp[index] = val;
			}

			grpArr.push(grp);
		}

		console.log(grpArr);

		// TODO :: fix grp
		grpArr = shuffle(grpArr);
		for (var i=0; i<grpArr.length; i++) {
			var grp = grpArr[i];
			for (key in grp) {

				$('tr:eq('+(i+2)+') td:eq('+key+')').text(grp[key]);
			}
		}

	} else {

		var colArr = $('td[colindex='+colIndex+']').map(function() {
			return $(this).attr('data');
		}).get();
		console.log(colArr);

		console.log({colArr: colArr, dataType: dataType});
		$.post('/scramble', {colArr: colArr, dataType: dataType}, function(jsonstr) {

			var data = JSON.parse(jsonstr).data;

			console.log(colIndex);
			console.log(data);

			var j = 0;
			for (var i=0; i<colArr.length; i++) {
				var cell = $('tr:eq('+(i+2)+') td[colindex='+colIndex+']');
				if (cell.attr('data') != "")
					cell.text(data[j++]);
			}
		});
	}
	
	if (dataType == '') {
		$('td[colindex='+colIndex+']').each(function() {
			$(this).text($(this).attr('data'));
		});
	}

	$(el).attr('old', dataType);
}