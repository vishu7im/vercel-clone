const express = require("express");

const httpProxy = require("http-proxy");

const app = express();

const PORT = 8000;

const BASE_PATH = `https://vercel-clone-source.s3.ap-south-1.amazonaws.com/__output`;

const Proxy = httpProxy.createProxyServer();

app.use((req, res) => {
  const hostname = req.hostname;
  const subdomin = hostname.split(".")[0];

  const resolveTo = `${BASE_PATH}/${subdomin}`;

  console.log(hostname);
  return Proxy.web(req, res, { target: resolveTo, changeOrigin: true });
});

Proxy.on("proxyReq", (proxyrequest, req, res) => {
  let url = req.url;

  if (url === "/") {
    proxyrequest.path += "index.html";
  }
});

app.listen(PORT, () => {
  console.info(`[server]:[${PORT}] reverse proxy`);
});
