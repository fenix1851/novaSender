const User = require('../models/User')
const Role = require('../models/Role')
const Token = require('../models/Token')

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const uuid = require('uuid')
const mailService = require('../services/mailService')

const {secret, secretRefresh, apiUrl} = require('../config')

const {validationResult} = require('express-validator')
const config = require('../config')
 
const generateTokens = (id, roles)=>{
    const payload = {
        id,
        roles
    }
    const accessToken = jwt.sign(payload, secret, {expiresIn: '1h'})
    const refreshToken = jwt.sign(payload, secretRefresh, {expiresIn: '30d'})
    return {
        accessToken,
        refreshToken
    }
}
const saveToken = async (userId, refreshToken) =>{
    const tokenData = await Token.findOne({user: userId})
    if (tokenData) {
        tokenData.refreshToken = refreshToken
        return tokenData.save();
    }
    const token = await Token.create({user: userId, refreshToken})
    return token;
}

const removeToken = async(refreshToken) =>{
    const tokenData = await Token.deleteOne({refreshToken})
    return tokenData
}

const findToken = async(refreshToken)=> {
    const tokenData = await Token.findOne({refreshToken})
    return tokenData
}

const refreshTokenFunction = async(refreshToken)=>{
    console.log(refreshToken)
    if(!refreshToken){
        console.log('There are no refresh token')
        return 401
    }
    
    const userData = validateRefreshToken(refreshToken)
    const tokenFromDb = await findToken(refreshToken)
    console.log(userData)
    console.log(tokenFromDb)

    // if(!userData || !tokenFromDb){
    //     throw 401
    // }
    const user = await User.findById(userData.id)
    const tokens = generateTokens(user._id, user.roles, user.subscription)
    await saveToken(user._id, tokens.refreshToken)
    console.log(tokens)
    return {...tokens, user: user._id}
}

const validateAccesToken = (token)=>{
    try {
        const userData = jwt.verify(token, config.secret)
        return userData
    } catch (e) {
        console.log(e)
        return null;
    }
}

const validateRefreshToken = (token)=>{
    try {
        const userData = jwt.verify(token, config.secretRefresh)
        return userData
    } catch (e) {
        console.log(e)
        return null;
    }
}

// controller with authorization functions
class authControler {
    // registration function
    async reg(req,res){
        try {
            // try to catch errors in password/username, errors create on previous level while validating.
            const errors = validationResult(req)
            if(!errors.isEmpty()){
                let errorsString = ''
                errors.errors.forEach(element => {
                    console.log(element.msg)
                    errorsString += element.msg + ' '
                })
                return res.status(403).json({message:'Registration errors: '+errorsString})
            }

            console.log(req.body.email)
            const {username, password, email} = req.body

            // try to find user with same login
            const usernamelUniqueVerify = await User.findOne({username})
            if (usernamelUniqueVerify) {
                return res.status(403).json({message:"User with this name already registred"})
            }

            // try to find user with same email
            const emailUniqueVerify = await User.findOne({email})
            if (emailUniqueVerify) {
                return res.status(403).json({message:"User with this email already registred"})
            }

            // hashing the password
            const hashedPassword = bcrypt.hashSync(password,6)

            // creating a user
            const user = new User({username,email, password: hashedPassword, roles: [], subscriptionStart: ''})
           
            await user.save()
            const unVerifiedUser = await User.findOne({username})
            if(!unVerifiedUser) {
                return res.status(403).json({message: 'Internal DataBase error'})
            }

            // creaing an activation link 
            const activationLink = apiUrl + '/auth/verify/'+ unVerifiedUser._id;
            console.log(activationLink)

            // sending email with activation link
            await mailService.sendActivationMail(email, activationLink)

           

            return res.status(200).json({message: `On email: ${email} sended message with verify link`})
        } catch (e) {
            console.log(e)
            res.status(500).json({message: 'Registration Error'})
        }
    }  

    async login(req,res){
        try {
            const {username, password} = req.body
            const user = await User.findOne({username})
            if (!user) {
                return res.status(500).json({message:`There are no user ${username} registred`})
            }
            const validPassword = await bcrypt.compare(password, user.password)
            if(!validPassword){
                return res.status(500).json({message:`Incorrect password, try again!`})
            }
            // genereating tokens
            const tokens = generateTokens(user._id, user.roles, user.subscription)
            await saveToken(user._id, tokens.refreshToken)
            res.cookie('refreshToken', tokens.refreshToken, {maxAge: 30*24*60*60*1000, httpOnly: true})
            return res.json({tokens, user: user._id})
        } catch (e) {
            console.log(e)
            res.status(500).json({message: 'Login Error'})

        }
    }

    async logout(req, res) {
        try {
            const {refreshToken} = req.body
            if(!refreshToken){
                return res.status(403).json({message: 'User already logout'})
            }
            res.clearCookie('refreshCookie')
            const token = await removeToken(refreshToken)
            return res.status(200)
        } catch (e) {
            console.log(e)
            return res.status(500).json({message:'Internal Server Error'})
        }
    }

    async refresh(req,res) {
        try {
            // get refresh token from request body
            const {refreshToken} = req.body
            const userData = await refreshTokenFunction(refreshToken)
            console.log(userData)
            res.cookie('refreshToken', userData.refreshToken, )
            return res.json({maxAge: 30*24*60*60*1000, httpOnly: true, ...userData})
        } catch (e) {
            console.log("error")
            console.log(e)
            return res.status(500).json({message:'Internal Server Error'})
        }
        
    }

    async verify(req,res) {
        try {
            // init roles
            // await Role.create({value:"USER"})
            // await Role.create({value:"ADMIN"})
            const uid = req.params.link 
            const user = await  User.findOne({uid})
            if(!user){
                throw new Error('')
            }
            const userRole = await Role.findOne({value: "ADMIN"})
            user.roles = userRole.value
            console.log(user.roles)
            user.save()
            return res.redirect(`${apiUrl}/`);
        } catch (e) {
            console.log(e)
        }
        
    }
    async initAdmin(req,res){
        try {
            const {code, username, password, email} = req.body()
            if(code != secret){
                return res.status(403).json({message: 'Acces Denied'})
            }            
            const usernameUniqueVerify = await User.findOne({username})
            if (usernameUniqueVerify) {
                return res.status(500).json({message:"User with this name already registred"})
            }
            const emailUniqueVerify = await User.findOne({username})
            if (emailUniqueVerify) {
                return res.status(500).json({message:"User with this name already registred"})
            }
        } catch (e) {
            console.log(e)
            return res.status(500).json({message:'Internal Server Error'})
        }
    }
}



module.exports = new authControler()