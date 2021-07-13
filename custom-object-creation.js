require('dotenv').config()
// const express = require('express')
// const request = require('request-promise-native')
// const NodeCache = require('node-cache')
// const session = require('express-session')
// const opn = require('open')
// const app = express()
const hubspot = require('@hubspot/api-client')

const { APP_ID, API_KEY, CLIENT_ID, CLIENT_SECRET, LOCAL_URL, BASE_URL, SCOPE, PORT, AUTH_CALLBACK } = process.env

const objectMarkup = require('./event_object.json')

const createCustomObject = async (customObject, apiKey) => {
  console.log('')
  console.log('=== Creating that custom object ===')
  
  const hubspotClient = new hubspot.Client({ apiKey: apiKey })
  const result = await hubspotClient.apiRequest({
    method: 'POST',
    path: '/crm/v3/schemas',
    body: customObject,
    json: true
  })
  .then((results) => {
    console.log(results.body)
    return results.body
  })
  .catch((err) => {
    console.error(err)
    return err
  })
}

const customObject = createCustomObject(objectMarkup, API_KEY);
// console.log('customObject')
// console.log(customObject)
// https://share.hsforms.com/1HQFxv1OERwizjJW_wbPB0Q3fmpl

