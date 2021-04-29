(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{59:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return r})),n.d(t,"metadata",(function(){return c})),n.d(t,"rightToc",(function(){return l})),n.d(t,"default",(function(){return b}));var a=n(2),i=n(6),o=(n(0),n(74)),r={id:"installation",title:"Getting started",sidebar_label:"Getting started"},c={unversionedId:"installation",id:"installation",isDocsHomePage:!1,title:"Getting started",description:"Installing",source:"@site/docs/installation.md",permalink:"/relational-schema/docs/installation",editUrl:"https://github.com/MattGson/relational-schema/docs/docs/installation.md",sidebar_label:"Getting started",sidebar:"someSidebar",previous:{title:"Intro",permalink:"/relational-schema/docs/"}},l=[{value:"Installing",id:"installing",children:[]},{value:"Generating the schema",id:"generating-the-schema",children:[{value:"Configuring code gen",id:"configuring-code-gen",children:[]}]}],s={rightToc:l};function b(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(o.b)("wrapper",Object(a.a)({},s,n,{components:t,mdxType:"MDXLayout"}),Object(o.b)("h2",{id:"installing"},"Installing"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{}),"npm i relational-schema\n")),Object(o.b)("h2",{id:"generating-the-schema"},"Generating the schema"),Object(o.b)("p",null,"Relational-schema generates code from your database schema."),Object(o.b)("p",null,"It does this by running queries against your database to work out the table schema as well as the relations between tables."),Object(o.b)("div",{className:"admonition admonition-important alert alert--info"},Object(o.b)("div",Object(a.a)({parentName:"div"},{className:"admonition-heading"}),Object(o.b)("h5",{parentName:"div"},Object(o.b)("span",Object(a.a)({parentName:"h5"},{className:"admonition-icon"}),Object(o.b)("svg",Object(a.a)({parentName:"span"},{xmlns:"http://www.w3.org/2000/svg",width:"14",height:"16",viewBox:"0 0 14 16"}),Object(o.b)("path",Object(a.a)({parentName:"svg"},{fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"})))),"important")),Object(o.b)("div",Object(a.a)({parentName:"div"},{className:"admonition-content"}),Object(o.b)("p",{parentName:"div"},"We never recommend running the code gen against your production database. Instead you should run it against a local database with the same schema."))),Object(o.b)("h3",{id:"configuring-code-gen"},"Configuring code gen"),Object(o.b)("p",null,"Define a config file ",Object(o.b)("inlineCode",{parentName:"p"},"introspect-config.json")," in the root directory of your project.\nThis file is only used for code-gen, not for connecting during run-time.\nChange the contents of the file to connect to your database."),Object(o.b)("p",null,"The ",Object(o.b)("inlineCode",{parentName:"p"},"outdir")," option specifies where the Javascript schema files will be output.\nThis should be inside of your project source so that the files are transpiled as part of your build."),Object(o.b)("p",null,"Supported output formats:"),Object(o.b)("ul",null,Object(o.b)("li",{parentName:"ul"},Object(o.b)("inlineCode",{parentName:"li"},"json"),", ",Object(o.b)("inlineCode",{parentName:"li"},"es6"),", ",Object(o.b)("inlineCode",{parentName:"li"},"ts"),", ",Object(o.b)("inlineCode",{parentName:"li"},"cjs"))),Object(o.b)("p",null,"For the ",Object(o.b)("inlineCode",{parentName:"p"},"client")," option you can choose between ",Object(o.b)("inlineCode",{parentName:"p"},"mysql")," and ",Object(o.b)("inlineCode",{parentName:"p"},"pg"),"."),Object(o.b)("p",null,"You can optionally specify a ",Object(o.b)("inlineCode",{parentName:"p"},"prettierConfig")," which should be a path to a valid ",Object(o.b)("inlineCode",{parentName:"p"},"prettierrc")," file.\nThis will be used to format the output files rather than the default formatting."),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{className:"language-json"}),'{\n    "host": "127.0.0.1",\n    "port": 3306,\n    "user": "root",\n    "password": "",\n    "database": "users",\n    "schema": "public",\n    "outdir": "./src/generated",\n    "format": "json",\n    "client": "pg"\n}\n')),Object(o.b)("p",null,"Run:"),Object(o.b)("pre",null,Object(o.b)("code",Object(a.a)({parentName:"pre"},{}),"relations introspect\n")),Object(o.b)("p",null,"The above commands will generate the schema for ",Object(o.b)("inlineCode",{parentName:"p"},"users")," database.\nThe resulting files are stored in ",Object(o.b)("inlineCode",{parentName:"p"},"./src/generated"),"."))}b.isMDXComponent=!0}}]);