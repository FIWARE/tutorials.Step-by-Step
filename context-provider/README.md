This is a simple Node.js express application which offers an NGSI v1 proxy
interface to four context providers.

# QueryContext Endpoints

The following NGSI v1 endpoints are supported

-   `/random/<type>/<mapping>/queryContext`. returns random data values of
    `"type": "<type>"` - e.g. `/random/text/quote/queryContext` will return
    random lorem ipsum

-   `/static/<type>/<mapping>/queryContext` returns static data values of
    `"type": "<type>"` - e.g. `/static/text/quote/queryContext` will return "I
    never could get the hang of thursdays"

-   `/twitter/<type>/<mapping><queryString>/<attr>/queryContext` Work in
    progress

-   `/weather/<type>/<mapping>/<queryString>/<attr>/queryContext` Retrieves the
    Weather data for the `queryString` location and maps the data from the given
    `attr` to the entity response.

    For Example `/proxy/weather/number/berlin%2cde/wind_speed/queryContext` will
    read the `wind_speed` value from Berlin. and
    `/proxy/weather/number/cairo%2ceg/temp/queryContext` will read the `temp`
    value from Cairo.

## Mappings

NGSI attribute names should follow Data Model Guidelines (e.g. `camelCasing`)
Data returned from third-party APIs will not enforce the same guidelines. It is
therefore necessary to invoke a mapping to be able to know which values to
retieve.

The mapping path element is assumes that mappings are defined in the path as
follows:

-   `temperature`
    -   `temperature` NGSI attribute maps to `temperature` attribute on the API
        data
-   `temperature:temp`
    -   `temperature` NGSI attribute maps to `temp` attribute on the API data
-   `temperature:temp,windSpeed:wind_speed`
    -   `temperature` NGSI attribute maps to `temp` attribute on the API data
    -   `windSpeed` NGSI attribute maps to `wind_speed` attribute on the API
        data

For the full guidelines see the
[FIWARE Data Models](https://fiware-datamodels.readthedocs.io/en/latest/guidelines/index.html)

## Health Check Endpoints

The following health check endpoints are supported:

-   `/random/health` A non-error response shows that an NGSI proxy is available
    on the network and returning values. Each Request will return some random
    dummy data.

-   `/static/health` A non-error response shows that an NGSI proxy is available
    on the network and returning values. Each Request will return the same data.

-   `/twitter/health` A non-error response shows that an NGSI proxy for the
    Twitter API is available on the network and returning values.

    If the proxy is correctly configured to connect to the Twitter API, a series
    of Tweets will be returned.

    The Twitter API uses OAuth2:

    -   To get Consumer Key & Consumer Secret for the Twitter API, you have to
        create an app in Twitter via
        [https://developer.twitter.com/](https://developer.twitter.com/). Then
        you'll be taken to a page containing Consumer Key & Consumer Secret.
    -   For more information see:
        [https://developer.twitter.com/](https://developer.twitter.com/)

-   `/weather/health` A non-error response shows that an NGSI proxy for the
    Weather API is available on the network and returning values.

    If the proxy is correctly configured to connect to the Open Weather Map API,
    the current weather in Berlin will be returned.

    Most of the Weather API features require an API key.

    -   Sign up for a key at
        [`https://openweathermap.org/api`](https://openweathermap.org/api)
    -   For more information see:
        [`https://openweathermap.org/appid`](https://openweathermap.org/appid)

## Keys and Secrets

All Keys and Secrets must be passed in using Environment variables. The
following variables **must** be provided

-   `OPENWEATHERMAP_KEY_ID=<ADD_YOUR_KEY_ID>`
-   `TWITTER_CONSUMER_KEY=<ADD_YOUR_CONSUMER_KEY>`
-   `TWITTER_CONSUMER_SECRET=<ADD_YOUR_CONSUMER_SECRET>`

---

## License

MIT © 2018 FIWARE Foundation e.V.

See the LICENSE file in the root of this project for license details.

The Program includes additional icons downloaded from www.flaticon.com which
were obtained under license:

-   Smashicons -
    [https://www.flaticon.com/authors/smashicons](https://www.flaticon.com/authors/smashicons) -
    CC 3.0 BY
-   Those Icons -
    [https://www.flaticon.com/authors/those-icons](https://www.flaticon.com/authors/those-icons) -
    CC 3.0 BY
-   Freepik - [http://www.freepik.com/](http://www.freepik.com/) - CC 3.0 BY
