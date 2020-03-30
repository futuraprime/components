const utils = require('./cli/utils')

const runningComponents = () => {
  let componentConfig, instanceConfig

  if (process.argv[2] === 'registry') {
    return true
  }

  try {
    componentConfig = utils.legacyLoadComponentConfig(process.cwd())
  } catch (e) {}
  try {
    instanceConfig = utils.legacyLoadInstanceConfig(process.cwd())
  } catch (e) {}

  if (!componentConfig && !instanceConfig) {
    // When no in service context and plain `serverless` command, return true when user in China
    // It's to enable interactive CLI components onboarding for Chinese users
    return process.argv.length === 2 && utils.IS_IN_CHINA
  }

  if (instanceConfig && !instanceConfig.component) {
    return false
  }

  return true
}

module.exports = { runningComponents }
