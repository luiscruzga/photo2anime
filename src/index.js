const EventEmitter = require('events');
const puppeteer = require('puppeteer');
const request = require('request');
const fs = require('fs');
const path = require('path');
const { convertTo64 } = require('../utils/base64');
var timeRefresh = 120;

const randomUUI = (a,b) => {for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'');return b}

/**
 * photo2anime class class that allows you to transform an image (where a person's face is clearly visible) to give it an anime / manga effect.
 * Use what is created by photo2cartoon
 * 
 * @class photo2anime
 * @extends {EventEmitter}
 * @see {@link https://github.com/minivision-ai/photo2cartoon|Photo2Cartoon}
 */

class photo2anime extends EventEmitter {
    constructor() {
        super();

        this.config = {
            token: '',
            appKey: '',
            timestamp: ''
        }

        this.getConfigInfo();
        setInterval(() => {
            this.getConfigInfo();
        }, 60000 * timeRefresh);
    }

    /**
     * Allows you to transform an image to apply an anime / manga style
     * 
     * @param {objet} args
     * @param {string} args.photo - Image to transform, can be image path, image url or base64 image
     * @param {string} args.destinyFolder - Path to save the transformed image, if not provided the image will be delivered in base64
     * @return {Promise<string>} Transformed image
     */
    transform(args) {
        return new Promise((resolve, reject) => {
            if (typeof args.photo !== 'undefined' && args.photo !== '') {
                if (this.config.token === '' || this.config.appKey === '' || this.config.timestamp === '') {
                    reject('The main configuration cannot yet be loaded to operate, please wait a few more seconds...');
                } else {
                    convertTo64(args.photo)
                    .then(async (res) => {
                        let imageDelete = false;
                        let base64Image = res.split(';base64,').pop();
                        let nameFile = `${ randomUUI() }.jpeg`;
                        let pathImage = path.join(__dirname, `../images/${ nameFile }`);
                        fs.writeFileSync(pathImage, base64Image, {encoding: 'base64'}, (err) => {
                            console.log('File created');
                        });
                        
                        this.uploadImage(pathImage)
                        .then(dataImage => {
                            imageDelete = true;
                            fs.unlinkSync(pathImage);
                            if (dataImage.resCode === 1 && dataImage.resData !== undefined && dataImage.resData.fileUrl !== undefined && dataImage.resData.fileUrl !== ''){
                                this.getAnime(dataImage.resData.fileUrl)
                                .then(data => {
                                    if(data.status === 0 && data.data !== undefined && data.data.base64 !== undefined && data.data.base64 !== ''){
                                        let base64Anime = data.data.base64.split(';base64,').pop();
                                        if (args.destinyFolder !== undefined && args.destinyFolder !== ''){
                                            if (fs.existsSync(args.destinyFolder)) {
                                                const finalImage = path.join(args.destinyFolder, nameFile);
                                                fs.writeFileSync(finalImage, base64Anime, {encoding: 'base64'}, (err) => {
                                                    console.log('File created');
                                                });
                                                resolve(finalImage);   
                                            } else {
                                                reject('Destiny Directory not found.');
                                            }
                                        } else {
                                            resolve(base64Anime);
                                        }
                                    }else {
                                        reject('An error occurred while trying to transform the image');
                                    }
                                })
                                .catch(err => {
                                    console.log('error', err);
                                    reject('An error occurred while trying to transform the image');
                                })
                            }else {
                                reject('An error occurred while trying to load the image to be transformed');
                            }
                        })
                        .catch(err => {
                            if(!imageDelete){
                                fs.unlinkSync(pathImage);
                            }
                            reject(err);
                        })
                    })
                    .catch(err => {
                        reject(err);
                    })
                }
            } else {
                reject('An image must be provided to transform...');
            }
        })
    }

    /**
     * It allows obtaining the initial data to transform the image
     */
    async getConfigInfo() {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', async (request) => {
          if (request.url() === 'https://ai.minivision.cn/apiagw/api/v1/cartoon/self_cartoon'){
              const _headers = request.headers();
              const _postData = request.postData();
              this.config.token = _headers.token;
              this.config.appKey = JSON.parse(_postData).appKey;
              this.config.timestamp = JSON.parse(_postData).timestamp;
              this.emit('ready');
          }
          request.continue();
        });
      
        await page.goto('https://ai.minivision.cn/#/coreability/cartoon', {
          waitUntil: 'load',
          timeout: 0
        });
      
        await browser.close();
    }
    
    getAnime(in_url_image) {
        return new Promise((resolve, reject) => {
            //Custom Header pass
            var headersOpt = {
                "content-type": "application/json",
                "token": this.config.token
            };
            request(
                    {
                    method:'post',
                    url:'https://ai.minivision.cn/apiagw/api/v1/cartoon/self_cartoon',
                    body: {
                        "needFilter": false
                        ,"filterName": ''
                        ,"appKey": this.config.appKey
                        ,"timestamp": this.config.timestamp
                        ,"imageUrl": in_url_image
                    },
                    headers: headersOpt,
                    json: true,
                }, (error, response, body) => {
                    if(error){
                        reject(error);
                    }else {
                        resolve(body);
                    }
                }
            );
        });
    }
    
    uploadImage(in_image) {
        return new Promise((resolve, reject) => {
            const options = {
                method: "POST",
                url: "https://file.miniclouds.cn:27777/file/upload",
                headers: {
                    "mvusername": "mini-ai",
                    "sysname": "mini-ai",
                    "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundaryuoHFA0U7s9C0KOZE"
                },
                formData : {
                    "isHttps": "true",
                    "file" : fs.createReadStream(in_image)
                }
            };
    
            request(options, (err, res, body) => {
                if(err){
                    reject(err);
                }else {
                    resolve(JSON.parse(JSON.parse(body)))
                }
            });
        })
    }
}

module.exports = photo2anime;