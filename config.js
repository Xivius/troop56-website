//const dotenv = require('dotenv').config();
//if (dotenv.error) throw dotenv.error;
module.exports = {
  port: process.env.port,
  base_uri: process.env.base_uri,
  scope: process.env.scope,
  web: {
    client_id: process.env.client_id,
    client_secret: process.env.client_secret,
    token_uri: process.env.token_uri,
    redirect_uris: process.env.redirect_uris.split(' ')
  }
};
