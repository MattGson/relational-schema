(window.webpackJsonp=window.webpackJsonp||[]).push([[2],{65:function(e,t,a){"use strict";a.r(t);var n=a(0),l=a.n(n),r=a(76),i=a(66),c=a(69),o=a(68);var m=function(e){var t=e.metadata;return l.a.createElement("nav",{className:"pagination-nav","aria-label":"Blog list page navigation"},l.a.createElement("div",{className:"pagination-nav__item"},t.previous&&l.a.createElement(o.a,{className:"pagination-nav__link",to:t.previous.permalink},l.a.createElement("div",{className:"pagination-nav__sublabel"},"Previous"),l.a.createElement("div",{className:"pagination-nav__label"},"\xab ",t.previous.title))),l.a.createElement("div",{className:"pagination-nav__item pagination-nav__item--next"},t.next&&l.a.createElement(o.a,{className:"pagination-nav__link",to:t.next.permalink},l.a.createElement("div",{className:"pagination-nav__sublabel"},"Next"),l.a.createElement("div",{className:"pagination-nav__label"},t.next.title," \xbb"))))};var s=function(e,t,a){var l=Object(n.useState)(void 0),r=l[0],i=l[1];Object(n.useEffect)((function(){var n,l;function c(){var c=function(){var e=0,t=null;for(n=document.getElementsByClassName("anchor");e<n.length&&!t;){var l=n[e],r=l.getBoundingClientRect().top;r>=0&&r<=a&&(t=l),e+=1}return t}();if(c){var o=0,m=!1;for(l=document.getElementsByClassName(e);o<l.length&&!m;){var s=l[o],d=s.href,u=decodeURIComponent(d.substring(d.indexOf("#")+1));c.id===u&&(r&&r.classList.remove(t),s.classList.add(t),i(s),m=!0),o+=1}}}return document.addEventListener("scroll",c),document.addEventListener("resize",c),c(),function(){document.removeEventListener("scroll",c),document.removeEventListener("resize",c)}}))},d=a(73);var u=function(){var e=Object(i.a)().siteConfig.title,t=function(){var e=Object(d.useActivePlugin)();if(!e)throw new Error("DocVersionCallout is only supposed to be used on docs-related routes");return e.pluginId}(),a=Object(d.useActiveVersion)(t),n=Object(d.useDocVersionSuggestions)(t),r=n.latestDocSuggestion,c=n.latestVersionSuggestion;if(!c)return l.a.createElement(l.a.Fragment,null);var m,s=a.name,u=null!=r?r:(m=c).docs.find((function(e){return e.id===m.mainDocId}));return l.a.createElement("div",{className:"alert alert--warning margin-bottom--md",role:"alert"},"next"===s?l.a.createElement("div",null,"This is unreleased documentation for ",e," ",l.a.createElement("strong",null,s)," version."):l.a.createElement("div",null,"This is documentation for ",e," ",l.a.createElement("strong",null,"v",s),", which is no longer actively maintained."),l.a.createElement("div",{className:"margin-top--md"},"For up-to-date documentation, see the"," ",l.a.createElement("strong",null,l.a.createElement(o.a,{to:u.path},"latest version"))," ","(",c.name,")."))},v=a(67),g=a(52),E=a.n(g);function p(e){var t=e.headings;return s("table-of-contents__link","table-of-contents__link--active",100),l.a.createElement("div",{className:"col col--3"},l.a.createElement("div",{className:E.a.tableOfContents},l.a.createElement(f,{headings:t})))}function f(e){var t=e.headings,a=e.isChild;return t.length?l.a.createElement("ul",{className:a?"":"table-of-contents table-of-contents__left-border"},t.map((function(e){return l.a.createElement("li",{key:e.id},l.a.createElement("a",{href:"#"+e.id,className:"table-of-contents__link",dangerouslySetInnerHTML:{__html:e.value}}),l.a.createElement(f,{isChild:!0,headings:e.children}))}))):null}t.default=function(e){var t,a=Object(i.a)().siteConfig,n=void 0===a?{}:a,o=n.url,s=n.title,d=e.content,g=d.metadata,f=g.description,h=g.title,b=g.permalink,_=g.editUrl,N=g.lastUpdatedAt,w=g.lastUpdatedBy,y=g.version,k=d.frontMatter,C=k.image,O=k.keywords,j=k.hide_title,x=k.hide_table_of_contents,L=h?h+" | "+s:s,I=Object(c.a)(C,{absolute:!0});return l.a.createElement(l.a.Fragment,null,l.a.createElement(r.a,null,l.a.createElement("title",null,L),l.a.createElement("meta",{property:"og:title",content:L}),f&&l.a.createElement("meta",{name:"description",content:f}),f&&l.a.createElement("meta",{property:"og:description",content:f}),O&&O.length&&l.a.createElement("meta",{name:"keywords",content:O.join(",")}),C&&l.a.createElement("meta",{property:"og:image",content:I}),C&&l.a.createElement("meta",{property:"twitter:image",content:I}),C&&l.a.createElement("meta",{name:"twitter:image:alt",content:"Image for "+h}),b&&l.a.createElement("meta",{property:"og:url",content:o+b}),b&&l.a.createElement("link",{rel:"canonical",href:o+b})),l.a.createElement("div",{className:Object(v.a)("container padding-vert--lg",E.a.docItemWrapper)},l.a.createElement("div",{className:"row"},l.a.createElement("div",{className:Object(v.a)("col",(t={},t[E.a.docItemCol]=!x,t))},l.a.createElement(u,null),l.a.createElement("div",{className:E.a.docItemContainer},l.a.createElement("article",null,y&&l.a.createElement("div",null,l.a.createElement("span",{className:"badge badge--secondary"},"Version: ",y)),!j&&l.a.createElement("header",null,l.a.createElement("h1",{className:E.a.docTitle},h)),l.a.createElement("div",{className:"markdown"},l.a.createElement(d,null))),(_||N||w)&&l.a.createElement("div",{className:"margin-vert--xl"},l.a.createElement("div",{className:"row"},l.a.createElement("div",{className:"col"},_&&l.a.createElement("a",{href:_,target:"_blank",rel:"noreferrer noopener"},l.a.createElement("svg",{fill:"currentColor",height:"1.2em",width:"1.2em",preserveAspectRatio:"xMidYMid meet",viewBox:"0 0 40 40",style:{marginRight:"0.3em",verticalAlign:"sub"}},l.a.createElement("g",null,l.a.createElement("path",{d:"m34.5 11.7l-3 3.1-6.3-6.3 3.1-3q0.5-0.5 1.2-0.5t1.1 0.5l3.9 3.9q0.5 0.4 0.5 1.1t-0.5 1.2z m-29.5 17.1l18.4-18.5 6.3 6.3-18.4 18.4h-6.3v-6.2z"}))),"Edit this page")),(N||w)&&l.a.createElement("div",{className:"col text--right"},l.a.createElement("em",null,l.a.createElement("small",null,"Last updated"," ",N&&l.a.createElement(l.a.Fragment,null,"on"," ",l.a.createElement("time",{dateTime:new Date(1e3*N).toISOString(),className:E.a.docLastUpdatedAt},new Date(1e3*N).toLocaleDateString()),w&&" "),w&&l.a.createElement(l.a.Fragment,null,"by ",l.a.createElement("strong",null,w)),!1))))),l.a.createElement("div",{className:"margin-vert--lg"},l.a.createElement(m,{metadata:g})))),!x&&d.rightToc&&l.a.createElement(p,{headings:d.rightToc}))))}}}]);