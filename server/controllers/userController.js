const {
    json
} = require('express')
const User = require('../models/User')
const Base = require('../models/Base')
const Distribution = require('../models/Distributions')
const fsp = require('fs').promises
const fs = require('fs')
const xlsx = require('xlsx')
var formidable = require('formidable');
const path = require('path');

class userController {
    // Get user 
    async getUser(req, res) {
        try {
            let id = req.user.id
            console.log(id)
            const user = await User.findById(id)
            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                })
            }
            res.json(user)
        } catch (e) {
            console.log(e)

        }
    }

    async addMoney(req, res) {
        try {
            let id = req.user.id
            const user = await User
                .findByIdAndUpdate(id, {
                    $inc: {
                        balance: req.body.amount
                    }
                }, {
                    new: true
                })
            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                })
            }
            res.json(user)
        } catch (e) {
            console.log(e)

        }
    }

    async uploadTable(req, res) {
        try {
            // get form 
            let form = new formidable.IncomingForm()
            form.parse(req, async function (err, fields, files) {
                if (files) {
                    // get file
                    let file = files['file']
                    if(!file){
                        return res.json({
                            message: 'Файл не выбран'
                        })
                    }
                    if(!file.originalFilename.endsWith('.xlsx')){
                        return res.json({
                            message: 'File is not xlsx'
                        })
                    }
                    // get file extension
                    let fileext = file.originalFilename.split('.').pop()
                    let filename = Math.random().toString(36).substring(7) + '.' + 'csv'
                    // convert to csv
                    let filedata = await fsp.readFile(file.filepath)
                    let workbook = xlsx.read(filedata)
                    let sheet_name_list = workbook.SheetNames
                    // convert to csv with , separator
                    let csv = xlsx.utils.sheet_to_csv(workbook.Sheets[sheet_name_list[0]], {
                        RS: ',',
                        FS: ','
                    })
                    // save csv
                    let pathToFile = path.join(__dirname, '..', 'static', 'files', filename)
                    await fsp.writeFile(pathToFile, csv)
                    return res.json({
                        message: 'File uploaded',
                        filename: filename
                    })
                } else {
                    return res.json({
                        message: "form"
                    })
                }

            })
        } catch (e) {
            console.log(e)
            res.status(500).json({
                message: 'File upload error'
            })

        }
    }

    async analyzeTable(req, res) {
        try {
            let filename = req.body.filename
            let pathToFile = path.join(__dirname, '..', 'static', 'files', filename)
            let file = await fsp.readFile(pathToFile)
            let numbersArray = file.toString().split(',')
            let validNumbers = []
            let invalidNumbersCount = 0
            numbersArray.forEach(element => {
                if (element.length == 11) {
                    if (element[0] == 7) {
                        if (element.includes(' ') || element.includes('-') || element.includes('(') || element.includes(')')) {
                            invalidNumbersCount++
                        } else {
                            validNumbers.push(element)
                        }

                    } else {
                        invalidNumbersCount++
                    }
                } else {
                    invalidNumbersCount++
                }
            })
            res.json({
                message: 'File analyzed',
                total: numbersArray.length,
                validNumbers: validNumbers,
                validNumbersCount: validNumbers.length,
                invalidNumbersCount: invalidNumbersCount,
                cost: invalidNumbersCount * 1
            })
        } catch (e) {
            console.log(e)
            return res.status(500).json({
                message: 'File analyze error'
            })
        }
    }

    async improveTable(req, res) {
        try {
            let filename = req.query.filename
            let pathToFile = path.join(__dirname, '..', 'static', 'files', filename)
            let file = await fsp.readFile(pathToFile)
            let numbersArray = file.toString().split(',')
            let validNumbers = []
            let invalidNumbersCount = 0
            let corruptedNumbers = []
            numbersArray.forEach(element => {
                if (element.length == 11) {
                    if (element[0] == 7) {
                        if (element.includes(' ') || element.includes('-') || element.includes('(') || element.includes(')')) {
                            invalidNumbersCount++
                        } else {
                        }

                    } else {
                        invalidNumbersCount++
                    }
                } else {
                    invalidNumbersCount++
                }
            })
            // check if balance is enough
            let id = req.user.id
            const user = await User.findById(id)
            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                })
            }
            if (user.balance < invalidNumbersCount * 1) {
                return res.status(403).json({
                    message: 'Not enough money'
                })
            }
            // improve numbers
            numbersArray.forEach(mobile => {
                // console.log(mobile[0] == 8)
                // console.log(mobile[0] != '')
                mobile = mobile.replace(/ /g, '')
                mobile = mobile.replace(/-/g, '')
                mobile = mobile.replace('(', '')
                mobile = mobile.replace(')', '')
                mobile = mobile.replace('+7', '8')
                if (mobile[0] == 7) {
                    mobile = '8' + mobile.slice(1)
                }
                if (mobile != '' && mobile[0] == 8 && mobile.length == 11) {
                    // console.log(mobile)
                    // mobile = '+7 '+mobile.slice(1,4)+' '+mobile.slice(4,7)+'-'+mobile.slice(7,9)+'-'+mobile.slice(9,11)
                    mobile = '7' + mobile.slice(1)
                    validNumbers.push(mobile)
                } else {
                    console.log(mobile)
                    corruptedNumbers.push(mobile)
                }
            })
            // decrease balance
            user.balance -= invalidNumbersCount * 1
            await user.save()
            // add base
            let base = await addBase(filename, validNumbers, id)
            // save file
            return res.json({
                message: 'File improved',
                total: numbersArray.length,
                validNumbersCount: validNumbers.length,
                invalidNumbersCount: invalidNumbersCount,
                corruptedNumbersCount: corruptedNumbers.length,
                startCost: invalidNumbersCount * 1,
                endCost: invalidNumbersCount - corruptedNumbers.length * 1,
            })
                

        } catch (e) {
            console.log(e)
            return res.status(500).json({
                message: 'File improve error'
            })
        }
    }

    async addBase(req, res) {
        try {
            let filename = req.body.filename
            let arrayOfNumbers = req.body.arrayOfNumbers
            let userId = req.user.id
            if(!filename || !arrayOfNumbers || !userId) {
                return res.status(400).json({
                    message: 'Bad request'
                })
            }
            // if path to file not exist
            let pathToFile = path.join(__dirname, '..', 'static', 'files', filename)
            // promise function if path exists
            if (!fs.existsSync(pathToFile)) {
                return res.status(404).json({
                    message: 'File not found'
                })
            }
            let NewBase = await addBase(filename, arrayOfNumbers, userId)
            return res.json({
                message: 'Base added',
                base: NewBase
            })

        } catch (e) {
            console.log(e)
            return res.status(500).json({
                message: 'Add base error'
            })
        }
    }
    async getBases(req, res) {
        try {
            let userId = req.user.id
            const bases = await Base.find({user: userId
            })
            // return except of numbers array
            console.log(bases)
            bases.forEach(base => {
                base.numbers = null
            }
            )
            return res.json({
                message: 'Bases found',
                bases: bases
            })
        } catch (e) {
            console.log(e)
            return res.status(500).json({
                message: 'Get bases error'
            })
        }
    }
   
    async createDistribution(req, res) {
        try {
            let baseName = req.body.baseName
            let text = req.body.text
            let name = req.body.name
            let userId = req.user.id
            if(!baseName || !text || !userId) {
                return res.status(400).json({
                    message: 'Bad request'
                })
            }
            let result = await createDistributionFunc(baseName, userId, text, name)
            if(result == 404) {
                return res.status(404).json({
                    message: 'Base not found'
                })
            }
            if(result == 403) {
                return res.status(403).json({
                    message: 'Not enough money'
                })
            }
            return res.json({
                message: 'Distribution created',
                links: result
            })
        } catch (e) {
            console.log(e)
            return res.status(500).json({
                message: 'Create distribution error'
            })
        }
    }

    async getDistributions(req, res) {
        try {
            let userId = req.user.id
            const distributions = await Distribution.find({user: userId
            })
            //  iterate over distributions, get base and add base.cont to distribution
            for (let i = 0; i < distributions.length; i++) {
                let base = await Base.findById(distributions[i].base)
                distributions[i].links = base.count
            }
            return res.json({
                message: 'Distributions found',
                distributions: distributions
            })
        } catch (e) {
            console.log(e)
            return res.status(500).json({
                message: 'Get distributions error'
            })
        }
    }

}

const addBase = async function addBase(fileName, arrayOfNumbers, userId) {
    try {
        let NewBase = new Base({
            filename: fileName,
            numbers: arrayOfNumbers,
            user: userId,
            count: arrayOfNumbers.length,
        })
        await NewBase.save()
        return NewBase
    } catch (e) {
        console.log(e)
        return null
    }
}

const createDistributionFunc = async function createDistribution(baseName, userId, text, name) {
    try {
        let base = await Base.findOne ({filename : baseName+'.csv', user: userId})
        if(!base) {
            return 404
        }
        // get user balance
        let user = await User.findById(userId)
        if(!user) {
            return 404
        }
        
        let links = []
        let count = base.count
        // check if balance is enough
        if(user.balance < count * 1) {
            403
        }
        let numbers = base.numbers
        let url = new URL('https://web.whatsapp.com/send/')
        numbers.forEach(number => {
            url.searchParams.set('phone', number)
            url.searchParams.set('text', text)
            url.searchParams.set('type', 'phone_number')
            url.searchParams.set('app_absent', '0')
            links.push(`${url.href},`)
        }
        )
        // create Distribution
        let NewDistribution = new Distribution({
            base: base._id,
            user: userId,
            text: text,
            links: links,
            name: name
        })
        await NewDistribution.save()
        console.log(NewDistribution)

    }
    catch (e) {
        console.log(e)
        return null
    }
}

        

module.exports = new userController()