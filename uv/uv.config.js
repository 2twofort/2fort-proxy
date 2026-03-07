self.__uv$config = {
  prefix: '/2fort-proxy/service/',
  bare:   'https://proxy.2fort.lol/bare/',
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,
  handler: '/2fort-proxy/uv/uv.handler.js',
  bundle:  '/2fort-proxy/uv/uv.bundle.js',
  config:  '/2fort-proxy/uv/uv.config.js',
  sw:      '/2fort-proxy/proxy-sw.js',
};
