# FIWARE Step-by-Step Tutorials Context Provider

[![FIWARE Documentation](https://img.shields.io/badge/FIWARE-Documentation-000000.svg?label=FIWARE&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAVCAYAAAC33pUlAAAABHNCSVQICAgIfAhkiAAAA8NJREFUSEuVlUtIFlEUx+eO+j3Uz8wSLLJ3pBiBUljRu1WLCAKXbXpQEUFERSQF0aKVFAUVrSJalNXGgmphFEhQiZEIPQwKLbEUK7VvZrRvbr8zzjfNl4/swplz7rn/8z/33HtmRhn/MWzbXmloHVeG0a+VSmAXorXS+oehVD9+0zDN9mgk8n0sWtYnHo5tT9daH4BsM+THQC8naK02jCZ83/HlKaVSzBey1sm8BP9nnUpdjOfl/Qyzj5ust6cnO5FItJLoJqB6yJ4QuNcjVOohegpihshS4F6S7DTVVlNtFFxzNBa7kcaEwUGcbVnH8xOJD67WG9n1NILuKtOsQG9FngOc+lciic1iQ8uQGhJ1kVAKKXUs60RoQ5km93IfaREvuoFj7PZsy9rGXE9G/NhBsDOJ63Acp1J82eFU7OIVO1OxWGwpSU5hb0GqfMydMHYSdiMVnncNY5Vy3VbwRUEydvEaRxmAOSSqJMlJISTxS9YWTYLcg3B253xsPkc5lXk3XLlwrPLuDPKDqDIutzYaj3eweMkPeCCahO3+fEIF8SfLtg/5oI3Mh0ylKM4YRBaYzuBgPuRnBYD3mmhA1X5Aka8NKl4nNz7BaKTzSgsLCzWbvyo4eK9r15WwLKRAmmCXXDoA1kaG2F4jWFbgkxUnlcrB/xj5iHxFPiBN4JekY4nZ6ccOiQ87hgwhe+TOdogT1nfpgEDTvYAucIwHxBfNyhpGrR+F8x00WD33VCNTOr/Wd+9C51Ben7S0ZJUq3qZJ2OkZz+cL87ZfWuePlwRcHZjeUMxFwTrJZAJfSvyWZc1VgORTY8rBcubetdiOk+CO+jPOcCRTF+oZ0okUIyuQeSNL/lPrulg8flhmJHmE2gBpE9xrJNkwpN4rQIIyujGoELCQz8ggG38iGzjKkXufJ2Klun1iu65bnJub2yut3xbEK3UvsDEInCmvA6YjMeE1bCn8F9JBe1eAnS2JksmkIlEDfi8R46kkEkMWdqOv+AvS9rcp2bvk8OAESvgox7h4aWNMLd32jSMLvuwDAwORSE7Oe3ZRKrFwvYGrPOBJ2nZ20Op/mqKNzgraOTPt6Bnx5citUINIczX/jUw3xGL2+ia8KAvsvp0ePoL5hXkXO5YvQYSFAiqcJX8E/gyX8QUvv8eh9XUq3h7mE9tLJoNKqnhHXmCO+dtJ4ybSkH1jc9XRaHTMz1tATBe2UEkeAdKu/zWIkUbZxD+veLxEQhhUFmbnvOezsJrk+zmqMo6vIL2OXzPvQ8v7dgtpoQnkF/LP8Ruu9zXdJHg4igAAAABJRU5ErkJgggA=)](https://fiware-tutorials.rtfd.io)
[![Docker](https://img.shields.io/docker/pulls/fiware/tutorials.context-provider.svg)](https://hub.docker.com/r/fiware/tutorials.context-provider/)

Simple nodejs express application for use with the FIWARE Step-by-Step tutorials.
Each tutorial consists of a series of exercises to demonstrate the correct use of
individual FIWARE components and shows the flow of context data within a simple Smart
Solution either by connecting to a series of dummy IoT devices or manipulating
the context directly or programmatically.


This application provides various sources of context and demonstrates various aspects of FIWARE
To run the application in debug mode add `DEBUG=tutorial:*`


# Store Application

* `WEB_APP_PORT=3000` # Port used by the content provider proxy and web-app for viewing
* `CONTEXT_BROKER=http://orion:1026/v2` - URL of the context broker to update context
* `NGSI_LD_PREFIX=` - Whether to use full URNs for devices
* `SECURE_ENDPOINTS=true` - Enable Keyrock as PDP - default is `false`


# Dummy Ultralight Devices

* `IOTA_HTTP_HOST=iot-agent` - The URL of the IoT Agent
* `IOTA_HTTP_PORT=7896`  - Port used by the dummy IoT devices to commuicate with the IoT Agent
* `DUMMY_DEVICES_PORT=3001` - Port used by the dummy IoT devices to receive commands
* `DUMMY_DEVICES_TRANSPORT=HTTP` -  Default transport used by dummy Io devices (either `HTTP` or `MQTT`)
* `DUMMY_DEVICES_API_KEY=4jggokgpepnvsb2uv4s40d59ov` - Device API Key.


# Keyrock

* `KEYROCK_URL=http://localhost` - URL for Keyrock IDM
* `KEYROCK_IP_ADDRESS=http://172.18.1.5` - IP address for Keyrock IDM
* `KEYROCK_PORT=3005` - Port that Keyrock is listening on
* `KEYROCK_CLIENT_ID=tutorial-dckr-site-0000-xpresswebapp` - Client ID for the appliction within keyrock
* `KEYROCK_CLIENT_SECRET=tutorial-dckr-site-0000-clientsecret`  - Client secret for the appliction within keyrock
