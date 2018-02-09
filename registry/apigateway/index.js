const AWS = require('aws-sdk')
const Serverless = require('../../lib')

const { getSwaggerDefinition } = Serverless

const APIGateway = new AWS.APIGateway({region: 'us-east-1'})

const remove = async (name, id) => {
  await APIGateway.deleteRestApi({
    restApiId: id
  }).promise()
  const outputs = {
    id: null,
    url: null
  }
  return outputs
}

const create = async ({ name, lambda, path, method, role }) => {
  const swagger = getSwaggerDefinition(name, lambda, path, method, role)
  const json = JSON.stringify(swagger)

  const res = await APIGateway.importRestApi({
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({ restApiId: res.id, stageName: 'dev' }).promise()

  const outputs = {
    id: res.id,
    url: `https://${res.id}.execute-api.us-east-1.amazonaws.com/dev/${path.replace(/^\/+/, '')}`
  }
  return outputs
}

const update = async ({ name, lambda, path, method, role }, id) => {
  const swagger = getSwaggerDefinition(name, lambda, path, method, role)
  const json = JSON.stringify(swagger)

  await APIGateway.putRestApi({
    restApiId: id,
    body: Buffer.from(json, 'utf8')
  }).promise()

  await APIGateway.createDeployment({ restApiId: id, stageName: 'dev' }).promise()

  const outputs = {
    id,
    url: `https://${id}.execute-api.us-east-1.amazonaws.com/dev/${path.replace(/^\/+/, '')}`
  }
  return outputs
}

module.exports = async (inputs, state) => {
  const noChanges = (inputs.name === state.name && inputs.method === state.method &&
    inputs.path === state.path && inputs.lambda === state.lambda && inputs.role === state.role)
  let outputs
  if (noChanges) {
    outputs = state
  } else if (inputs.name && !state.name) {
    console.log(`Creating APIG: ${inputs.name}`)
    outputs = await create(inputs)
  } else if (state.name && !inputs.name) {
    console.log(`Removing APIG: ${state.name}`)
    outputs = await remove(state.name, state.id)
  } else if (inputs.name !== state.name) {
    console.log(`Removing APIG: ${state.name}`)
    await remove(state.name, state.id)
    console.log(`Creating APIG: ${inputs.name}`)
    outputs = await create(inputs)
  } else {
    console.log(`Updating APIG: ${inputs.name}`)
    outputs = await update(inputs, state.id)
  }
  return outputs
}
