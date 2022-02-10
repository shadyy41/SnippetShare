const myTextarea = document.getElementById("code-editor")

let codeMirror = CodeMirror.fromTextArea(myTextarea, {
  lineNumbers: true,
  mode: "text/x-c++src",
  tabSize: 2,
  lineWrapping: true,//scroll = false
  readOnly: false,
  autoCloseBrackets: true,
  theme: 'monokai'
})

const themeSelector = document.getElementById("theme-selector")
const changeTheme = (theme) =>{
  codeMirror.setOption('theme', theme)
}

themeSelector.addEventListener('change', ()=>{
  changeTheme(themeSelector.value)
})

const languageSelector = document.getElementById("language-selector")
const changeLanguage = (language) =>{
  codeMirror.setOption('mode', language)
}

languageSelector.addEventListener('change', ()=>{
  // console.log(codeMirror)
  changeLanguage(languageSelector.value)
})

//read only, theme, tabSize, language, line wrapping