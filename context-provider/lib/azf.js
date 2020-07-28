const request = require('request');
const xml2js = require('xml2js');

const debug = require('debug')('tutorial:azf');
const authzforcePort = process.env.AUTHZFORCE_PORT || '8080';
const authzforceUrl =
  (process.env.AUTHZFORCE_URL || 'http://localhost') + ':' + authzforcePort;

exports.Authzforce = function (clientId) {
  this._clientId = clientId;
};

exports.Authzforce.prototype.policyDomainRequest = function (
  domain,
  roles,
  resource,
  action,
  username,
  email
) {
  const that = this;

  let body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">\n';

  // Include all the necessary information available about the
  // who is requesting the resources

  body =
    body +
    '  <Attributes Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject">\n' +
    // Add the username to the request
    '     <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:subject:subject-id" IncludeInResult="false">\n' +
    '        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">' +
    username +
    '</AttributeValue>\n' +
    '     </Attribute>\n' +
    // Add the user's email to the request
    '     <Attribute AttributeId="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" IncludeInResult="false">\n' +
    '        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">' +
    email +
    '</AttributeValue>\n' +
    '     </Attribute>\n';

  if (roles.length > 0) {
    for (const i in roles) {
      body =
        body +
        //    '  <Attributes Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject">\n' +
        '     <Attribute AttributeId="urn:oasis:names:tc:xacml:2.0:subject:role" IncludeInResult="false">\n' +
        '        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">' +
        roles[i].id +
        '</AttributeValue>\n' +
        '     </Attribute>\n';
      //    '  </Attributes>\n';
    }
  }

  body = body + '  </Attributes>\n';

  body =
    body +
    // Include information available about the resource requested.
    // This could be expanded to add header information if necessary.
    '  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource">\n' +
    // Add the Application Id
    '     <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" IncludeInResult="false">\n' +
    '        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">' +
    that._clientId +
    '</AttributeValue>\n' +
    '     </Attribute>\n' +
    // Add the URL of the resource requested
    '     <Attribute AttributeId="urn:thales:xacml:2.0:resource:sub-resource-id" IncludeInResult="false">\n' +
    '        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">' +
    resource +
    '</AttributeValue>\n' +
    '     </Attribute>\n' +
    '  </Attributes>\n' +
    // Include information available about the action requested
    '  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">\n' +
    // Add the HTTP Verb to the request
    '     <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" IncludeInResult="false">\n' +
    '        <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">' +
    action +
    '</AttributeValue>\n' +
    '     </Attribute>\n' +
    '  </Attributes>\n' +
    // Include any further information as necessary.
    '  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment" />\n' +
    '</Request>';

  const options = {
    method: 'POST',
    url: authzforceUrl + '/authzforce-ce/domains/' + domain + '/pdp',
    headers: { 'Content-Type': 'application/xml' },
    body,
  };

  return new Promise((resolve, reject) => {
    request(options, function (error, response, body) {
      let decision;
      xml2js.parseString(
        body,
        { tagNameProcessors: [xml2js.processors.stripPrefix] },
        function (err, jsonRes) {
          decision = jsonRes.Response.Result[0].Decision[0];
        }
      );
      debug('policyDomainRequest returns:' + decision);
      return error ? reject(error) : resolve(decision);
    });
  });
};
