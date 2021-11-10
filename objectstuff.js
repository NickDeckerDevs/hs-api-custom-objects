First name

Last name

Email

RSVP Yes/No

Number of Guests


var options = {
  method: 'POST',
  url: 'https://api.hubapi.com/crm/v3/schemas',
  qs: {hapikey: 'YOUR_HUBSPOT_API_KEY'},
  headers: {accept: 'application/json', 'content-type': 'application/json'},
  body: {
    labels: {singular: 'Event', plural: 'Events'},
    requiredProperties: ['event_id', 'event_name', 'first_name', 'last_name', 'email', 'rsvp', 'guests'],
    properties: [
      {name: 'event_name', label: 'Event Name', isPrimaryDisplayLabel: true},
      {name: 'event_id', label: 'Event ID', isPrimaryDisplayLabel: false},
      {name: 'first_name', label: 'First Name', isPrimaryDisplayLabel: false},
      {name: 'last_name', label: 'Last Name', isPrimaryDisplayLabel: false},
      {name: 'email', label: 'Email Address', isPrimaryDisplayLabel: false},
      {name: 'rsvp', label: 'RSVP', isPrimaryDisplayLabel: false},
      {name: 'guests', label: 'Guests', isPrimaryDisplayLabel: false}
    ],
    associatedObjects: ['CONTACT'],
    name: 'event_object',
    primaryDisplayProperty: 'Event Name',
    metaType: 'PORTAL_SPECIFIC'
  },
  json: true
};