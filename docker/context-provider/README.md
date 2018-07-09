# FIWARE Step-by-Step Tutorials Context Provider




        - "DEBUG=proxy:*"
        - "WEB_APP_PORT=3000" # Port used by the content provider proxy and web-app for viewing data
        - "IOTA_HTTP_HOST=iot-agent"
        - "IOTA_HTTP_PORT=7896"
        - "DUMMY_DEVICES_PORT=3001" # Port used by the dummy IOT devices to receive commands
        - "DUMMY_DEVICES_TRANSPORT=HTTP" # Default transport used by dummy Io devices
        - "DUMMY_DEVICES_API_KEY=4jggokgpepnvsb2uv4s40d59ov"
        - "CONTEXT_BROKER=http://orion:1026/v2" # URL of the context broker to update context
        - "NGSI_LD_PREFIX="
        - "CRATE_DB_SERVICE_URL=http://crate-db:4200/_sql"
        - "OPENWEATHERMAP_KEY_ID=<ADD_YOUR_KEY_ID>"
        - "TWITTER_CONSUMER_KEY=<ADD_YOUR_CONSUMER_KEY>"
        - "TWITTER_CONSUMER_SECRET=<ADD_YOUR_CONSUMER_SECRET>"