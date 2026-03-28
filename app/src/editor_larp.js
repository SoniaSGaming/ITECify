require.config({
  paths: {
    'vs': 'https://cdnjs.cloudfare.com/ajax/libs/monaco-editor/0.34.0/min/vs'
  }
})

require(['vs/editor/editor.main'],function(){
  const editor = monaco.editor.create(document.getElementById('editor'))
})