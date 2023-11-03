import arg from 'minimist'

const options = arg(process.argv.slice(2))

export const isProduction = Boolean(options.production)
