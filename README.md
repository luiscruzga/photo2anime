# Photo2Anime!

![image](./images/results.png)

Transform your images applying an anime / manga style using AI.

It is based on the [Photo2Cartoon](https://github.com/minivision-ai/photo2cartoon) repository

## Installation

    npm i --save photo2anime


## Example


Transform an image from an external url

```js
const photo2anime = require('photo2anime');
const anime = new photo2anime();

anime.on('ready', () => {
    anime.transform({
        photo: 'https://media.gq.com.mx/photos/5e220ec2ffa8c7000803441e/16:9/w_1920,c_limit/40-datos-curiosos-para-descubrir-a-scarlett-johansson.jpg',
        // To save the image to a specific path
        destinyFolder: './images'
    })
    .then(data => {
        console.log('Image', data);
    })
    .catch(err => {
        console.log('Error', err);
    })
})

```

Transform a local image and get image in base64

```js
const photo2anime = require('photo2anime');
const anime = new photo2anime();
const path = require('path');

anime.on('ready', () => {
    anime.transform({
        photo: path.join(__dirname, './image.jpg')
    })
    .then(data => {
        console.log('Image in base64', data);
    })
    .catch(err => {
        console.log('Error', err);
    })
})

```

## Related

You can find a job where this module is used directly on whatsapp here: [WABOT](https://github.com/luiscruzga/wabot)