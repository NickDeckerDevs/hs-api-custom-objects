require('dotenv').config()
const express = require('express')
const request = require('request-promise-native')
const NodeCache = require('node-cache')
const session = require('express-session')
const opn = require('open')
const app = express()

const { APP_ID, CLIENT_ID, CLIENT_SECRET, LOCAL_URL, BASE_URL, SCOPE, PORT } = process.env


const refreshTokenStore = {}
const accessTokenCache = new NodeCache({ deleteOnExpire: true })
if (!CLIENT_ID || !CLIENT_SECRET) {
  throw new Error('Missing CLIENT_ID or CLIENT_SECRET environment variables')
}
let SCOPES = ['contacts']
if(SCOPE) {
  SCOPES = (SCOPE.split(/ |, ?|%20/)).join(' ')
}

const REDIRECT_URI = `${BASE_URL}:${PORT}/${AUTH_CALLBACK}`


// session set up
app.use(session({
  secret: Math.random().toString(36).substring(2),
  resave: false,
  saveUninitialized: true
}))


// step 1 - auth url for redirect on app install
const authUrl = 
  `https://app.hubspot.com/oauth/authorize` + 
  `?client_id=${encodeURIComponent(CLIENT_ID)}` + // app client id
  `&scope=${encodeURIComponent(SCOPES)}` + // scopes being requested
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` // callback after approval

app.get('/install', (req, res) => {
  console.log('')
  console.log('=== Initiating OAuth 2.0 flow with HubSpot ===')
  console.log('')
  console.log("===> Step 1: Redirecting user to your app's OAuth URL")
  res.redirect(authUrl)
  console.log('===> Step 2: User is being prompted for consent by HubSpot')
})

// user is presented with UI to sign in / authenticate their user

// get auth code from server and process response

app.get(`/${AUTH_CALLBACK}`, async (req, res) => {
  console.log('===> Step 3: Handling the request sent by the server')

  if (req.query.code) {
    console.log('       > Received an authorization token')
    const authCodeProof = {
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code: req.query.code
    }

    // get access and refresh token
    console.log('===> Step 4: Exchanging authorization code for an access token and refresh token')
    const token = await exchangeForTokens(req.sessionID, authCodeProof)
    if (token.message) {
      return res.redirect(`/error?msg=${token.message}`)
    }

    // after response redirect to main route
    res.redirect('/')

  }
})

const exchangeForTokens = async (userId, exchagneProof) => {
  try {
    const responseBody = await request.post('https://api.hubapi.com/oauth/v1/token', {
      form: exchangeProof
    })
    const tokens = JSON.parse(responseBody)
    refreshTokenStore[userId] = tokens.refresh_token
    accessTokenCache.set(userId, tokens.access_token, Math.round(tokens.expires_in * 9.75))

    console.log('       > Received an access token and refresh token')
    return tokens.access_token
  } catch (e) {
    console.error(`       > Error exchanging ${exchangeProof.grant_type} for access token`)
    return JSON.parse(e.response.body)
  }
}

const refreshAccessToken = async (userId) => {
  const refreshTokenProof = {
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    refresh_token: refreshTokenStore[userId]
  }
  return await exchangeForTokens(userId, refreshTokenProof)
}

const getAccessToken = async (userId) => {
  // if expired, renew
  if (!accessTokenCache.get(userId)) {
    console.log('Refreshing expired access token')
    await refreshAccessToken(userId)
  }
  return accessTokenCache.get(userId)
}

const isAuthorized = (userId) => {
  return refreshTokenStore[userId] ? true : false
}


const getContact = async (accessToken) => {
  console.log('getting contact')
  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
    console.log('===> Replace the following request.get() to test other API calls')
    console.log('===> request.get(\'https://api.hubapi.com/contacts/v1/lists/all/contacts/all?count=1\')')
    const result = await request.get('https://api.hubapi.com/contacts/v1/lists/all/contacts/all?count=1', {
      headers: headers
    });

    return JSON.parse(result).contacts[0]

  } catch (e) {
    console.error('  > Unable to retrieve contact')
    return JSON.parse(e.response.body)
  }
}

const displayContactName = (res, contact) => {
  if (contact.status === 'error') {
    res.write(`<p>unable to retrieve contact! ErrorMessage: ${contact.message}</p>`)
    return
  }
  const { firstname, lastname } = contact.properties
  res.write(`<p>Contact Name: ${firstname.value} ${lastname.value}</p>`)
}

app.get('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.write(`<h2>chickens don't get a chance to gobble if they are always clucking up</h2>`)
  if (isAuthorized(req.sessionID)) {
    const accessToken = await getAccessToken(req.sessionID)
    const contact = await getContact(accessToken)
    res.write(`<h4>Access token: ${accessToken}</h4>`)
    displayContactName(res, contact)
  } else {
    res.write(`<a href="/install">Install the app to make this work right</a>`)
  }
  res.end()
})

app.get('/error', (req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.write(`<h1 style="color: red;">RED ALERT</h1><h4>Error: ${req.query.msg}</h4>`)
  res.end()
})

const REDIRECT_URI = `${BASE_URL}:${PORT}/${AUTH_CALLBACK}`
app.listen(PORT, () => console.log(`=== Starting your app on ${BASE_URL}:${PORT} ===`))
opn(`${BASE_URL}:${PORT}`)