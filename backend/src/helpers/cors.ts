export function parseOrigin(allowedOrigin: string | RegExp) {
  if (allowedOrigin instanceof RegExp) {
    return allowedOrigin
  } else if (allowedOrigin.indexOf('*') === -1) {
    // simple strings are compared directly
    return allowedOrigin
  } else {
    // need to build a regex
    const regex = new RegExp(`^${allowedOrigin.replace('.', '\\.').replace('*', '.*')}$`)
    return regex
  }
}

export function getCorsOptions(corsEnabledFor: string, isProd = true) {
  const allowedOrigins = corsEnabledFor
    ? corsEnabledFor.split(',').map((x) => parseOrigin(x.trim()))
    : []

  return {
    origin: isProd ? allowedOrigins : true,
    methods: ['GET', 'PUT', 'POST', 'OPTIONS'],
    credentials: isProd ? !allowedOrigins.includes('*') : true,
  }
}
