var users = new Array();


$(document).ready(function() {
	$('.progress').hide();
	$('#save-btn').hide();


	$('#search-btn').click(function(event) {
		$('.progress').fadeIn('500');
		loopSearch($('#search-input').val());
		$('#form-init').fadeOut('400');
	});

	$('#search-input').keydown(function(event) {
		if (event.keyCode == 13) {
			$('.progress').fadeIn('500');
			loopSearch($(this).val());
			$('#form-init').fadeOut('400');			
		}
	});

	$('#save-btn').click(function(event) {
		JSONToCSVConvertor(users, 'Git-search-'+$('#search-input').val(), true);
	});
});

/**
 * return Object with user details
 * @constructor
 * @param {string} locationSearch - Enter city name.
 * @param {page} Page - enter the number page from search list.
 */

function findUsers(locationSearch, page) {
	$.ajax({
		url: 'https://github.com/search',
		type: 'GET',		
		data: {
			p: page,
			q: 'location:'+locationSearch,
			ref: 'searchresults',
			type: 'Users',
			utf8: '%E2%9C%93'
		},
		async: false
	})
	.done(function(xhr) {
		var usersOnPage = $(xhr).find('.user-list-info');
		usersOnPage.each(function(index) {
			var userObj = new Object();
			userObj.name = $(this).contents().filter(function(){
			    return this.nodeType === window.Node.TEXT_NODE && $.trim(this.nodeValue) !== '';
			}).text().replace(/\s+/g,' ');
			userObj.nickname = $(this).find('a:first').text().replace(/\s+/g,' ');
			userObj.email = $(this).find('a.email').text().replace(/\s+/g,' ');
			userObj.location = $(this).find('ul.user-list-meta li:first').text().replace(/\s+/g,' ');
			users.push(userObj);
		});		
	})
	.error(function() {
		Materialize.toast('Была потеряна выдача со страницы ' + page, 4000)
	});
	
}

/**
 * return count pages from search list.
 * @constructor
 * @param {string} locationSearch - Enter city name.
 */
function getPageCount(locationSearch) {
	var pageCount = 0;
	$.ajax({
		url: 'https://github.com/search',
		type: 'GET',
		data: {
			q: 'location:'+locationSearch,
			ref: 'searchresults',
			type: 'Users',
			utf8: '%E2%9C%93'
		},
		async: false
	})
	.done(function(xhr){
		 var paginationBlock = $(xhr).find('.pagination a');
		 var pageCountText = $(paginationBlock[paginationBlock.length - 2]).text();
		 pageCount = parseInt(pageCountText);		 
	})
	return pageCount;
}

function loopSearch(locationSearch) {

	pageLength = getPageCount(locationSearch);
	
	var timeR = 1000;
		
	for (var page = 25; page <= pageLength; page++) {	
		timeR += 1000;	
		delayGet(page, pageLength, timeR, locationSearch);			
	}
}

function delayGet(page, pageLength, timeOut, locationSearch){
	setTimeout(function (){
		findUsers(locationSearch, page)
		var progress = page/(pageLength)*100
		$('.progress .determinate').width( progress.toString() + "%" );

		if ( parseInt(page)  == parseInt(pageLength) ) {			
			var jsonHtmlTable = ConvertJsonToTable(users, 'jsonTable', null, 'Download');
			$('.progress').fadeOut('500');
			$('#save-btn').fadeIn('400');			
			$('.table-js').html(jsonHtmlTable);
			$('#form-init').fadeIn('400');
		}

	}, timeOut);
}

function JSONToCSVConvertor(JSONData, ReportTitle, ShowLabel) {
    //If JSONData is not an object then JSON.parse will parse the JSON string in an Object
    var arrData = typeof JSONData != 'object' ? JSON.parse(JSONData) : JSONData;
    
    var CSV = '';    
    //This condition will generate the Label/Header
    if (ShowLabel) {
        var row = "";
        
        //This loop will extract the label from 1st index of on array
        for (var index in arrData[0]) {
            
            //Now convert each value to string and comma-seprated
            row += index + ',';
        }

        row = row.slice(0, -1);
        
        //append Label row with line break
        CSV += row + '\r\n';
    }
    
    //1st loop is to extract each row
    for (var i = 0; i < arrData.length; i++) {
        var row = "";
        
        //2nd loop will extract each column and convert it in string comma-seprated
        for (var index in arrData[i]) {
            row += '"' + arrData[i][index] + '",';
        }

        row.slice(0, row.length - 1);
        
        //add a line break after each row
        CSV += row + '\r\n';
    }

    if (CSV == '') {        
        alert("Invalid data");
        return;
    }   
    
    //Generate a file name
    var fileName = "";
    //this will remove the blank-spaces from the title and replace it with an underscore
    fileName += ReportTitle.replace(/ /g,"_");   
    
    //Initialize file format you want csv or xls
    var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);
    
    // Now the little tricky part.
    // you can use either>> window.open(uri);
    // but this will not work in some browsers
    // or you will not get the correct file extension    
    
    //this trick will generate a temp <a /> tag
    var link = document.createElement("a");    
    link.href = uri;
    
    //set the visibility hidden so it will not effect on your web-layout
    link.style = "visibility:hidden";
    link.download = fileName + ".csv";
    
    //this part will append the anchor tag and remove it after automatic click
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


