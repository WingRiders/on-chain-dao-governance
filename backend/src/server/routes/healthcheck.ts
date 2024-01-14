export const getHealthStatus = async () => {
  return {
    healthy: true,
    uptime: process.uptime(),
  }
}
