const hmr = document.createElement("script");
hmr.src = "/modules/sheexcelrefresh/@vite/client";
hmr.type = "module";
document.head.prepend(hmr);

const lib = document.createElement("script");
lib.src = "/modules/sheexcelrefresh/src/sheexcel.js";
lib.type = "module";
document.head.prepend(lib);
