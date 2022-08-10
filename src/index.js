const app = require('./lib/httpServer')

const PORT = process.env.PORT || 8000

app.listen(PORT, () => console.log(`Orbit-pinner listening on port ${PORT}`))
