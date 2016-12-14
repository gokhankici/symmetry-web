function parse_input(ID){
    var input = document.getElementById(ID).value;
    var split = input.split(";");
    return "seq(["+split +"])"
}

function make_request(IdL, IdR){
    var inL = parse_lines(document.getElementById(IdL).value);
    var inR = parse_lines(document.getElementById(IdR).value);
    var term="par([seq(["+inL+"]), seq(["+inR+"])])";
    //alert(term);
    var prologFile=":- load_files('rewrite.pl'). :- open_null_stream(Null), current_output(Out), set_output(Null),check_race_freedom("+ term +", T1), rewrite(T1, skip, [], _, Delta, _),set_output(Out),  web_transform(Delta, Delta1), format('~n~p~n',[Delta1]). :-halt."
    alert(prologFile);
    return prologFile;
}

function send_request(){
    var ret = make_request();
    var out = document.getElementById("ex1O");
    out.value = ret;
}

// callback takes 2 arguments: error (can be null) and response text
function sendTwoProgs(target, IdL, IdR, callback) {
  const httpRequest = new XMLHttpRequest()
  if (! httpRequest) {
    callback("CLIENT ERROR")
  }
  httpRequest.onreadystatechange = function() {
    if (httpRequest.readyState === XMLHttpRequest.DONE) {
      if (httpRequest.status === 200) {
        callback(null, httpRequest.responseText)
      } else {
        callback("SERVER ERROR !!!")
      }
    }
  }
  httpRequest.open('POST', target, true)
  httpRequest.setRequestHeader('Content-Type', 'application/json')
  httpRequest.send(JSON.stringify({
      prologFile: make_request(IdL, IdR)
  }))
}

function translate_icet() {
    var lines = document.getElementById("ex2IL").value;
    var parsed = parse_lines(lines);
    var outval = "no-match";
    if (parsed != null){
	outval = parsed
    }
    document.getElementById("ex2IR").value = outval;
}

function parse_end(endexp) {
    var Exp = /w*end/g;
    match = Exp.exec(endexp);
    if (match != null){
	return "]))";
    }
    else {
    	return null;
    }
}

function parse_sym(symexp) {
    var Exp = /w*sym\s+(\S*)\s+in\s+(\S*)\s+do/g;
    match = Exp.exec(symexp);
    if (match != null){
	return "sym("+match[1]+", "+ match[2]+", seq([";
    }
    else {
    	return null;
    }
}

function parse_for(forexp) {
    var Exp = /w*for\s+(\S*)\s+in\s+(\S*)\s+do/g;
    match = Exp.exec(forexp);
    if (match != null){
	return "for(env, "+ match[1]+", "+ match[2]+", seq([";
    }
    else {
    	return null;
    }
}

function parse_recvFrom(recvFrom) {
    var Exp = /w*(\S*):\s+recvFrom\s+(\S*)\s+(.[^\s;]*)\s*(;?)/g;
    match = Exp.exec(recvFrom);
    if (match != null){
	var comma = "";
	if (match[4]==";"){
	    comma=",";
	}
	return "recv("+ match[1]+","+ match[2]+", "+match[3]+")"+comma;
    }
    else {
    	return null;
    }
}

function parse_recv(recv) {
    var Exp = /w*(\S*):\s+recv\s+(.[^\s;]*)\s*(;?)/g;
    match = Exp.exec(recv);
    if (match != null){
	var comma = "";
	if (match[3]==";"){
	    comma=",";
	}
	return "recv("+ match[1]+","+ match[2]+")"+comma;
    }
    else {
    	return null;
    }
}

function parse_send(send) {
    var Exp = /w*(\S*):\s+send\s+(.\S*)\s+(.[^\s;]*)\s*(;?)/g;
    match = Exp.exec(send);
    if (match != null){
	var comma = "";
	if (match[4]==";"){
	    comma=",";
	}
	return "send("+ match[1]+","+ match[2]+","+match[3]+")"+comma;
    }
    else {
    	return null;
    }
}

function parse_line(line) {
    if (parse_send(line) != null){
	return parse_send(line);
    }
    else if (parse_recv(line) != null){
	return parse_recv(line);
    }
    else if (parse_recvFrom(line) != null){
	return parse_recvFrom(line);
    }
    else if (parse_for(line) != null){
	return parse_for(line);
    }
    else if (parse_sym(line) != null){
	return parse_sym(line);
    }
    else if (parse_end(line) != null){
	return parse_end(line);
    }
    else return null;
}

function parse_lines(string){
    var lines = string.split("\n");
    var out="";
    for(line of lines){
//	alert("parsing: "+line);
	var parsed=parse_line(line);
//	alert("parsed: "+parsed);
	if (parsed != null){
	    out=out+" "+parsed;
	}
    }
    return out;
}

function parse_response(res) {
    var myRegexp = /.*answer\((.*)\).*/g;
    var match = myRegexp.exec(res);
    return match[1];
}

function simpleRequest(IdL, IdR, IdO) {
  sendTwoProgs("/", IdL, IdR, (err, text) => {
      const output = err ? err : text
//      var res = output.match(//*.seq\(.*\)*./i);
      //      document.getElementById("ex1O").value = output;
      document.getElementById(IdO).value=parse_response(output);
  });
/*    document.getElementById("ex1O").value = make_request();*/
}
