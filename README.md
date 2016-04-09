tadtranscript
=============

tadtranscript is a node.js server that downloads wav files on request, and
passes them to IBM watson for transcription.

It currently returns the transcription to the console.

### Install

You can install the server dependencies using

    npm install

### Run

First edit the example_config.js with your IBM Watson credentials, and save it
to config.js


To start the server with nodemon, use

    npm run start

### Deploy

If you have ansible installed you can deploy this to your server infrastructure
by calling

    npm run deploy

After making sure you have installed geerlingguy's node.js role from
ansible-galaxy through:  

    ansible-galaxy install geerlingguy.nodejs
