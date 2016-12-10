function setupEditor(editorId) {
  var editor = ace.edit(editorId);
  editor.setTheme("ace/theme/xcode");
  editor.getSession().setMode("ace/mode/prolog");
  editor.setOptions({
    maxLines: 20,
    minLines: 20
  });
  editor.getSession().setUseWrapMode(true);
}

// callback takes 2 arguments: error (can be null) and response text
function sendTwoEditors(target, editorId1, editorId2, callback) {
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
    file1: ace.edit(editorId1).getValue(),
    file2: ace.edit(editorId2).getValue()
  }))
}
