
function pushAjax(url,params) {
	var xhr = new new XMLHttpRequest();

	/*xhr.onreadystatechange = function() {
		if (xhr.readyState==4 && xhr.status==200) {
			xhr.responseText
		}
	}*/

	xhr.open("GET",url,true);
	xhr.send();
}